"use client";

import React from 'react';


export default function AdminTemplatesPage() {
    const [mobileView, setMobileView] = React.useState<'components' | 'canvas' | 'properties'>('canvas');

    return (
        <div className="flex flex-col h-full absolute inset-0">
            {/* Toolbar relocated to content area top */}
            <div className="h-16 border-b border-[#232f48] bg-[#111722] px-6 flex items-center justify-between shrink-0">
                <h2 className="text-white text-lg font-bold hidden md:block">Template Actions</h2>
                <div className="flex items-center gap-2 md:hidden">
                    <span className="material-symbols-outlined text-primary">tune</span>
                    <span className="text-white font-bold">Editor</span>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-[#232f48] hover:bg-[#3b4b68] text-white text-sm font-medium rounded-lg border border-white/5 transition-colors">Preview</button>
                    <button className="px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">save</span> Save
                    </button>
                </div>
            </div>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Mobile View Toggles */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1a2336] border border-[#3b4b68] rounded-full p-1 flex items-center gap-1 shadow-xl z-50 lg:hidden">
                    <button
                        onClick={() => setMobileView('components')}
                        className={`p-3 rounded-full flex items-center justify-center transition-all ${mobileView === 'components' ? 'bg-primary text-white' : 'text-[#92a4c9] hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">widgets</span>
                    </button>
                    <button
                        onClick={() => setMobileView('canvas')}
                        className={`p-3 rounded-full flex items-center justify-center transition-all ${mobileView === 'canvas' ? 'bg-primary text-white' : 'text-[#92a4c9] hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">dashboard</span>
                    </button>
                    <button
                        onClick={() => setMobileView('properties')}
                        className={`p-3 rounded-full flex items-center justify-center transition-all ${mobileView === 'properties' ? 'bg-primary text-white' : 'text-[#92a4c9] hover:bg-white/5'}`}
                    >
                        <span className="material-symbols-outlined">settings</span>
                    </button>
                </div>

                {/* Left Panel: Components */}
                <div className={`${mobileView === 'components' ? 'flex' : 'hidden'} lg:flex w-full lg:w-64 border-r border-[#232f48] bg-[#111722] flex-col flex-shrink-0 z-10 absolute lg:static inset-0`}>
                    <div className="p-4 border-b border-[#232f48] flex justify-between items-center">
                        <h3 className="text-[#92a4c9] text-xs font-semibold uppercase tracking-wider">Components</h3>
                        <div className="flex items-center gap-1">
                            <div className="relative group">
                                <select className="bg-[#1a2336] appearance-none text-white text-[10px] border border-[#3b4b68] rounded px-2 pr-6 py-0.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                                    <option>Sensor 1</option>
                                    <option>Sensor 2</option>
                                    <option>Sensor 3</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-white/60">expand_more</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto flex-1 scrollbar-hide pb-24 lg:pb-4">
                        <div className="text-xs text-[#92a4c9]/50 font-medium mb-2">Display</div>

                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">speed</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Radial Gauge</span>
                                <span className="text-[10px] text-[#92a4c9]">Speed, Pressure</span>
                            </div>
                        </div>
                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-green-400 group-hover:scale-110 transition-transform">straighten</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Linear Ruler</span>
                                <span className="text-[10px] text-[#92a4c9]">Level, Distance</span>
                            </div>
                        </div>
                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-orange-400 group-hover:scale-110 transition-transform">123</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Value Display</span>
                                <span className="text-[10px] text-[#92a4c9]">Counters, Totals</span>
                            </div>
                        </div>
                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-purple-400 group-hover:scale-110 transition-transform">show_chart</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Sparkline</span>
                                <span className="text-[10px] text-[#92a4c9]">Trend over time</span>
                            </div>
                        </div>

                        <div className="text-xs text-[#92a4c9]/50 font-medium mb-2 mt-4">Controls</div>
                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-[#92a4c9] group-hover:scale-110 transition-transform">toggle_on</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Switch</span>
                                <span className="text-[10px] text-[#92a4c9]">On/Off Control</span>
                            </div>
                        </div>

                        <div className="text-xs text-[#92a4c9]/50 font-medium mb-2 mt-4">Charts</div>
                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-cyan-400 group-hover:scale-110 transition-transform">pulse_alert</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Pulse Chart</span>
                                <span className="text-[10px] text-[#92a4c9]">Real-time signal</span>
                            </div>
                        </div>
                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-blue-400 group-hover:scale-110 transition-transform">ssid_chart</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Line Chart</span>
                                <span className="text-[10px] text-[#92a4c9]">Continuous data</span>
                            </div>
                        </div>
                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-indigo-400 group-hover:scale-110 transition-transform">bar_chart</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Bar Chart</span>
                                <span className="text-[10px] text-[#92a4c9]">Categorical comparison</span>
                            </div>
                        </div>
                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-teal-400 group-hover:scale-110 transition-transform">area_chart</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Area Chart</span>
                                <span className="text-[10px] text-[#92a4c9]">Volume visualization</span>
                            </div>
                        </div>
                        <div className="bg-[#232f48]/50 hover:bg-[#232f48] p-3 rounded-lg flex items-center gap-3 cursor-move border border-white/5 hover:border-primary/50 transition-all group">
                            <span className="material-symbols-outlined text-pink-400 group-hover:scale-110 transition-transform">leaderboard</span>
                            <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">Column Chart</span>
                                <span className="text-[10px] text-[#92a4c9]">Vertical comparison</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center Panel: Canvas */}
                <div className={`${mobileView === 'canvas' ? 'flex' : 'hidden'} lg:flex flex-1 bg-[#0b0f17] relative overflow-hidden flex-col z-0`}>
                    <div className="h-10 bg-[#111722] border-b border-[#232f48] flex items-center justify-between px-4 shrink-0 z-10">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#92a4c9] hidden sm:inline">Canvas Size:</span>
                            <select className="bg-[#1a2336] text-white text-xs border border-[#3b4b68] rounded px-2 py-1 focus:outline-none">
                                <option>Responsive Grid</option>
                                <option>1920x1080</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-[#232f48] rounded text-[#92a4c9]"><span className="material-symbols-outlined text-[18px]">undo</span></button>
                            <button className="p-1.5 hover:bg-[#232f48] rounded text-[#92a4c9]"><span className="material-symbols-outlined text-[18px]">redo</span></button>
                            <div className="w-px h-4 bg-[#232f48] mx-1"></div>
                            <button className="p-1.5 hover:bg-[#232f48] rounded text-[#92a4c9]"><span className="material-symbols-outlined text-[18px]">zoom_in</span></button>
                            <button className="p-1.5 hover:bg-[#232f48] rounded text-[#92a4c9]"><span className="material-symbols-outlined text-[18px]">zoom_out</span></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-8 flex justify-center items-start grid-pattern relative pb-24 lg:pb-8">
                        <div className="relative w-[500px] h-[300px] border-2 border-blue-500/50 border-dashed rounded-lg flex flex-col items-center justify-center bg-[#232f48]/10 backdrop-blur-sm transition-all hover:bg-[#232f48]/20 group">
                            <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined text-blue-400/40 text-4xl">add_circle</span>
                                <div className="text-blue-400/40 text-sm font-bold uppercase tracking-wider select-none pointer-events-none">Drop Components Here</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Properties */}
                <div className={`${mobileView === 'properties' ? 'flex' : 'hidden'} lg:flex w-full lg:w-72 border-l border-[#232f48] bg-[#111722] flex-col flex-shrink-0 z-10 absolute lg:static inset-0`}>
                    <div className="p-4 border-b border-[#232f48] flex justify-between items-center">
                        <h3 className="text-white text-sm font-semibold">Properties</h3>
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded uppercase font-medium">Radial Gauge</span>
                    </div>

                    <div className="p-4 space-y-6 overflow-y-auto flex-1 scrollbar-hide pb-24 lg:pb-4">
                        <div className="space-y-3">
                            <label className="text-xs font-medium text-[#92a4c9] uppercase tracking-wider">Data Source</label>
                            <div>
                                <label className="block text-xs text-[#92a4c9] mb-1">Topic / Path</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-2 top-1.5 text-[#92a4c9] text-[16px]">link</span>
                                    <input className="w-full bg-[#1a2336] border border-[#3b4b68] rounded px-2 pl-8 py-1.5 text-xs text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none" type="text" defaultValue="machines/line1/motor/rpm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[#92a4c9] mb-1">Update Interval (ms)</label>
                                <input className="w-full bg-[#1a2336] border border-[#3b4b68] rounded px-2 py-1.5 text-xs text-white focus:border-primary outline-none" type="number" defaultValue="1000" />
                            </div>
                        </div>

                        <div className="border-t border-[#232f48] pt-4 space-y-3">
                            <label className="text-xs font-medium text-[#92a4c9] uppercase tracking-wider">Appearance</label>
                            <div>
                                <label className="block text-xs text-[#92a4c9] mb-1">Label</label>
                                <input className="w-full bg-[#1a2336] border border-[#3b4b68] rounded px-2 py-1.5 text-xs text-white focus:border-primary outline-none" type="text" defaultValue="Motor RPM" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-[#92a4c9] mb-1">Min Value</label>
                                    <input className="w-full bg-[#1a2336] border border-[#3b4b68] rounded px-2 py-1.5 text-xs text-white focus:border-primary outline-none" type="number" defaultValue="0" />
                                </div>
                                <div>
                                    <label className="block text-xs text-[#92a4c9] mb-1">Max Value</label>
                                    <input className="w-full bg-[#1a2336] border border-[#3b4b68] rounded px-2 py-1.5 text-xs text-white focus:border-primary outline-none" type="number" defaultValue="3000" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[#92a4c9] mb-1">Primary Color</label>
                                <div className="flex gap-2">
                                    <button className="w-6 h-6 rounded-full bg-primary ring-2 ring-offset-2 ring-offset-[#111722] ring-primary"></button>
                                    <button className="w-6 h-6 rounded-full bg-green-500 hover:opacity-80"></button>
                                    <button className="w-6 h-6 rounded-full bg-orange-500 hover:opacity-80"></button>
                                    <button className="w-6 h-6 rounded-full bg-red-500 hover:opacity-80"></button>
                                    <button className="w-6 h-6 rounded-full bg-[#3b4b68] hover:opacity-80"></button>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-[#232f48] pt-4 space-y-3">
                            <label className="text-xs font-medium text-[#92a4c9] uppercase tracking-wider">Thresholds</label>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white">Enable Warning</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input defaultChecked className="sr-only peer" type="checkbox" />
                                    <div className="w-9 h-5 bg-[#3b4b68] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-xs text-[#92a4c9] mb-1">Warning Level ( &gt; )</label>
                                <input className="w-full bg-[#1a2336] border border-[#3b4b68] rounded px-2 py-1.5 text-xs text-white focus:border-primary outline-none" type="number" defaultValue="2500" />
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-[#232f48] pb-24 lg:pb-4">
                        <button className="w-full py-2 bg-[#232f48] hover:bg-red-500/10 hover:text-red-500 text-[#92a4c9] text-xs font-medium rounded border border-[#3b4b68] hover:border-red-500/50 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">delete</span> Delete Widget
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
