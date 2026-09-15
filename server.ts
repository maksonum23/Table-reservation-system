import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Resend } from 'resend';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

dotenv.config();

const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = {};
try {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
} catch (e) {
  console.warn("Could not read firebase-applet-config.json");
}

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId || '(default)');

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Mock email transporter for prototype
  const transporter = {
    sendMail: async (options: any) => {
      console.log("Mock Email Sent:", options.subject, "to", options.to);
      return { messageId: uuidv4() };
    }
  };

  // Helper to parse duration (e.g. "1 hour", "1.5 hours", "2 hours", "4+ hours")
  const parseDurationHours = (durationStr: string): number => {
    if (!durationStr) return 2; // Default 2 hours
    const match = durationStr.match(/[\d.]+/);
    if (match) return parseFloat(match[0]);
    return 2;
  };

  // Helper to get end time in hours
  const getEndTime = (timeStr: string, durationStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    let startH = h + m / 60;
    if (startH < 6) startH += 24; // Treat AM times as next day
    return startH + parseDurationHours(durationStr);
  };

  const getStartTime = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    let startH = h + m / 60;
    if (startH < 6) startH += 24;
    return startH;
  };

  // API ROUTES

  // Get booked tables for a specific date and time
  app.get("/api/booked-tables", async (req, res) => {
    try {
      const { date, time, duration } = req.query;
      if (!date || !time) return res.json({ bookedTables: [] });

      const reqStart = getStartTime(time as string);
      const reqEnd = getEndTime(time as string, duration as string || "2");

      const q = query(
        collection(db, "reservations"), 
        where("date", "==", date as string),
        where("status", "==", "confirmed")
      );
      
      const querySnapshot = await getDocs(q);
      const bookedTables: number[] = [];

      querySnapshot.forEach((docSnap) => {
        const resData = docSnap.data();
        if (resData.tableId) {
          const resStart = getStartTime(resData.time);
          const resEnd = getEndTime(resData.time, resData.duration);
          
          // Check for overlap
          // reqStart < resEnd AND reqEnd > resStart
          if (reqStart < resEnd && reqEnd > resStart) {
            bookedTables.push(resData.tableId);
          }
        }
      });

      res.json({ bookedTables });
    } catch (error) {
      console.error("Failed to get booked tables", error);
      res.status(500).json({ error: "Failed to fetch tables" });
    }
  });
  
  // Create a reservation (pending)
  app.post("/api/reserve", async (req, res) => {
    try {
      const { date, time, duration, guests, tableId, name, email, phone } = req.body;
      
      const token = uuidv4();
      const reservationData = {
        token,
        status: 'pending',
        date, time, duration, guests, tableId, name, email, phone,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "reservations", token), reservationData);

      // Construct confirmation link based on the origin passed from frontend
      const origin = req.body.origin;
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const confirmUrl = origin ? `${origin}/?confirm=${token}` : `${protocol}://${host}/?confirm=${token}`;

      // Send email to guest
      if (resendClient) {
        try {
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'Osteria Reservations <onboarding@resend.dev>';
          await resendClient.emails.send({
            from: fromEmail,
            to: email,
            subject: "Confirm your reservation at Osteria",
            html: `<p>Hello ${name},</p><p>Please confirm your reservation for ${guests} guests on ${date} at ${time} (Duration: ${duration}).</p><p><a href="${confirmUrl}">Click here to confirm your reservation</a></p>`,
          });
          console.log("Guest email sent via Resend API to", email);
        } catch (err) {
          console.error("Resend API Error:", err);
        }
      } else {
        const info = await transporter.sendMail({
          from: '"Osteria Reservations" <no-reply@osteria.com>',
          to: email,
          subject: "Confirm your reservation at Osteria",
          text: `Hello ${name},\n\nPlease confirm your reservation for ${guests} guests on ${date} at ${time} (Duration: ${duration}).\n\nClick here to confirm: ${confirmUrl}`,
          html: `<p>Hello ${name},</p><p>Please confirm your reservation for ${guests} guests on ${date} at ${time} (Duration: ${duration}).</p><p><a href="${confirmUrl}">Click here to confirm your reservation</a></p>`,
        });
        console.log("Guest email sent (mocked)");
      }

      res.json({ 
        success: true, 
        message: "Confirmation email sent",
        _prototypeConfirmUrl: confirmUrl
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create reservation" });
    }
  });

  // Confirm reservation
  app.post("/api/confirm", async (req, res) => {
    try {
      const { token } = req.body;
      
      const resRef = doc(db, "reservations", token);
      const resSnap = await getDoc(resRef);

      if (!resSnap.exists()) {
        return res.status(404).json({ error: "Invalid or expired confirmation link" });
      }

      const reservation = resSnap.data();

      if (reservation.status === 'confirmed') {
        return res.json({ success: true, message: "Already confirmed", reservation });
      }

      // If they selected a table, verify it's still available
      if (reservation.tableId) {
        const reqStart = getStartTime(reservation.time);
        const reqEnd = getEndTime(reservation.time, reservation.duration);

        const q = query(
          collection(db, "reservations"), 
          where("date", "==", reservation.date),
          where("status", "==", "confirmed")
        );
        const querySnapshot = await getDocs(q);
        let isConflict = false;
        querySnapshot.forEach((docSnap) => {
          const resData = docSnap.data();
          if (resData.tableId === reservation.tableId) {
            const resStart = getStartTime(resData.time);
            const resEnd = getEndTime(resData.time, resData.duration);
            if (reqStart < resEnd && reqEnd > resStart) {
              isConflict = true;
            }
          }
        });

        if (isConflict) {
          return res.status(400).json({ error: "Sorry, this table was booked by someone else while you were confirming. Please make a new reservation." });
        }
      }

      // Mark as confirmed
      await updateDoc(resRef, { status: 'confirmed' });
      reservation.status = 'confirmed';

      // Send notification email to the owner
      const ownerEmail = "sparepostt@gmail.com";
      if (resendClient) {
        try {
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'Osteria System <onboarding@resend.dev>';
          await resendClient.emails.send({
            from: fromEmail,
            to: ownerEmail,
            subject: "New Confirmed Reservation!",
            html: `<p>You have a new confirmed reservation:</p><ul><li>Name: ${reservation.name}</li><li>Phone: ${reservation.phone}</li><li>Email: ${reservation.email}</li><li>Date: ${reservation.date}</li><li>Time: ${reservation.time}</li><li>Duration: ${reservation.duration}</li><li>Guests: ${reservation.guests}</li><li>Table: ${reservation.tableId || 'Not Selected'}</li></ul>`,
          });
          console.log("Owner email sent via Resend API to", ownerEmail);
        } catch (err) {
          console.error("Resend API Error:", err);
        }
      } else {
        const info = await transporter.sendMail({
          from: '"Osteria System" <system@osteria.com>',
          to: ownerEmail,
          subject: "New Confirmed Reservation!",
          text: `You have a new confirmed reservation:\n\nName: ${reservation.name}\nPhone: ${reservation.phone}\nEmail: ${reservation.email}\nDate: ${reservation.date}\nTime: ${reservation.time}\nDuration: ${reservation.duration}\nGuests: ${reservation.guests}\nTable: ${reservation.tableId || 'Not Selected'}`,
        });
        console.log("Owner email sent (mocked)");
      }

      res.json({ 
        success: true, 
        message: "Reservation confirmed",
        reservation
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to confirm reservation" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
