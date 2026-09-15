import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, CheckCircle2 } from 'lucide-react';
import { tables } from '../data';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  guests: number;
  selectedTableId: number | null;
  onSelectTable: (id: number) => void;
  bookedTables: number[];
};

export function TableMapModal({ isOpen, onClose, guests, selectedTableId, onSelectTable, bookedTables }: Props) {
  // Table filtering logic based on business requirements:
  // - 1-2 guests: Small tables (capacity 2) available. Large tables disabled.
  // - 3-4 guests: Large tables (capacity 4) available. Small tables disabled.
  // - 5+ guests: Extra large tables (capacity 6) available. Others disabled.
  const isTableAvailable = (id: number, capacity: number) => {
    if (bookedTables.includes(id)) return false;
    if (guests <= 0) return false;
    if (guests > 6) return false; // No single table can fit more than 6 guests
    if (guests <= 2) return capacity <= 2;
    if (guests <= 4) return capacity > 2 && capacity <= 4;
    return capacity > 4;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl bg-stone-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-stone-200 bg-white">
              <div>
                <h2 className="text-2xl font-serif text-stone-800">Select your table</h2>
                <p className="text-stone-500 mt-1 flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  Showing available tables for {guests} {guests === 1 ? 'guest' : 'guests'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-slate-50 flex-1 flex flex-col items-center">
              <div className="relative w-full max-w-4xl aspect-[16/9] bg-white rounded-none border border-slate-300 shadow-sm overflow-hidden p-4">
                
                {/* Blueprint / Floor Grid */}
                <div 
                  className="absolute inset-0 opacity-[0.1]" 
                  style={{ 
                    backgroundImage: 'linear-gradient(#64748b 1px, transparent 1px), linear-gradient(90deg, #64748b 1px, transparent 1px)', 
                    backgroundSize: '40px 40px' 
                  }}
                ></div>

                {/* Decorative Elements */}
                
                {/* Entrance Door */}
                <div className="absolute top-0 left-16 w-32 h-6 border-b border-l border-r border-slate-400 flex items-center justify-center bg-white z-0">
                  <span className="text-[10px] font-medium tracking-widest text-slate-500 uppercase">Entrance</span>
                </div>
                
                {/* Kitchen Area */}
                <div className="absolute bottom-0 right-0 w-72 h-32 bg-white border-t border-l border-slate-400 flex items-center justify-center z-0">
                  <div className="absolute inset-2 border border-dashed border-slate-300 pointer-events-none"></div>
                  <span className="text-sm font-medium tracking-widest text-slate-400 uppercase">Kitchen</span>
                </div>

                {/* Bar Area */}
                <div className="absolute top-0 right-0 w-16 h-56 bg-white border-b border-l border-slate-400 flex items-center justify-center z-0">
                  <div className="absolute inset-2 border border-slate-200 pointer-events-none"></div>
                  <span className="text-[10px] font-medium tracking-widest text-slate-400 uppercase -rotate-90 whitespace-nowrap">Bar Area</span>
                </div>

                {/* Architectural Plant placeholders (Minimalist circles) */}
                <div className="absolute bottom-8 left-8 w-16 h-16 rounded-full border border-slate-300 flex items-center justify-center z-0">
                  <div className="w-8 h-8 rounded-full border border-slate-200"></div>
                </div>
                <div className="absolute top-8 right-24 w-12 h-12 rounded-full border border-slate-300 flex items-center justify-center z-0">
                  <div className="w-6 h-6 rounded-full border border-slate-200"></div>
                </div>
                
                {/* Tables rendering */}
                {tables.map((table) => {
                  const available = isTableAvailable(table.id, table.capacity);
                  const isSelected = selectedTableId === table.id;
                  
                  return (
                    <button
                      key={table.id}
                      disabled={!available}
                      onClick={() => onSelectTable(table.id)}
                      className={`absolute flex flex-col items-center justify-center transition-all duration-300 ${
                        !available 
                          ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-lg scale-105 z-30'
                            : 'bg-white border-slate-400 text-slate-600 hover:border-slate-800 hover:text-slate-900 hover:shadow-md cursor-pointer group z-10 hover:z-20'
                      } border`}
                      style={{
                        left: `${table.x}%`,
                        top: `${table.y}%`,
                        width: `${table.width}%`,
                        height: `${table.height}%`,
                        transform: isSelected ? 'translate(-50%, -50%) scale(1.05)' : 'translate(-50%, -50%)',
                        borderRadius: table.capacity === 2 ? '9999px' : '0', // Square edges for architectural look
                      }}
                    >
                      {/* Chairs (Thin architectural outlines) */}
                      {/* Top and Bottom chairs (all tables) */}
                      <div className={`absolute -top-3 w-8 h-3 rounded-t-full transition-colors border-t border-l border-r ${!available ? 'border-slate-200 bg-transparent' : isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-400 bg-white group-hover:border-slate-800'}`} />
                      <div className={`absolute -bottom-3 w-8 h-3 rounded-b-full transition-colors border-b border-l border-r ${!available ? 'border-slate-200 bg-transparent' : isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-400 bg-white group-hover:border-slate-800'}`} />

                      {/* Capacity 4: one left, one right */}
                      {table.capacity === 4 && (
                        <>
                          <div className={`absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-l-full transition-colors border-t border-l border-b ${!available ? 'border-slate-200 bg-transparent' : isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-400 bg-white group-hover:border-slate-800'}`} />
                          <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-8 rounded-r-full transition-colors border-t border-r border-b ${!available ? 'border-slate-200 bg-transparent' : isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-400 bg-white group-hover:border-slate-800'}`} />
                        </>
                      )}

                      {/* Capacity 6: two left, two right */}
                      {table.capacity === 6 && (
                        <>
                          <div className={`absolute -left-3 top-[20%] w-3 h-8 rounded-l-full transition-colors border-t border-l border-b ${!available ? 'border-slate-200 bg-transparent' : isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-400 bg-white group-hover:border-slate-800'}`} />
                          <div className={`absolute -left-3 bottom-[20%] w-3 h-8 rounded-l-full transition-colors border-t border-l border-b ${!available ? 'border-slate-200 bg-transparent' : isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-400 bg-white group-hover:border-slate-800'}`} />
                          
                          <div className={`absolute -right-3 top-[20%] w-3 h-8 rounded-r-full transition-colors border-t border-r border-b ${!available ? 'border-slate-200 bg-transparent' : isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-400 bg-white group-hover:border-slate-800'}`} />
                          <div className={`absolute -right-3 bottom-[20%] w-3 h-8 rounded-r-full transition-colors border-t border-r border-b ${!available ? 'border-slate-200 bg-transparent' : isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-400 bg-white group-hover:border-slate-800'}`} />
                        </>
                      )}

                      <span className="text-xl font-light font-mono relative z-10">
                        T{table.id}
                      </span>
                      <span className="text-[9px] font-mono opacity-60 uppercase tracking-widest relative z-10">
                        {table.capacity}p
                      </span>
                      
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 shadow-sm z-30">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 flex gap-8 text-xs font-mono text-slate-500 bg-white px-6 py-3 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-slate-400 bg-white"></div>
                  <span>AVAILABLE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-slate-200 bg-slate-50"></div>
                  <span>UNAVAILABLE</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border border-blue-500 bg-blue-50"></div>
                  <span>SELECTED</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-stone-200 bg-white flex justify-end">
              <button
                onClick={onClose}
                disabled={!selectedTableId}
                className="px-8 py-3 bg-stone-800 text-white rounded-xl font-medium hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Selection
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
