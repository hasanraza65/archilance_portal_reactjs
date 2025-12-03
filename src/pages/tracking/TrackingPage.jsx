import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const TrackingDashboard = () => {
  
  // --- Colors Theme ---
  const colors = {
    primary: '#818cf8',   // Light Blue/Purple (Work)
    success: '#4ade80',   // Green (Productive)
    info: '#f472b6',      // Pink (Social)
    warning: '#fbbf24',   // Orange (Idle)
    secondary: '#e2e8f0', // Light Grey
  };

  const pieChartData = [
    { name: "Work", value: 65, color: colors.primary },
    { name: "Productive", value: 15, color: colors.secondary }, // Using light grey for big chunk if needed, or stick to theme
    { name: "Social", value: 12, color: colors.success },
    { name: "Idle", value: 8, color: colors.warning },
  ];
  
  // Note: Aapke screenshot mein blue bada hai, maine colors adjust kiye hain matching ke liye:
  const finalPieData = [
    { name: "Work", value: 65, color: '#a5b4fc' }, // Indigo-300
    { name: "Neutral", value: 15, color: '#d8b4fe' }, // Purple-300
    { name: "Social", value: 12, color: '#fca5a5' }, // Red-300
    { name: "Idle", value: 8, color: '#86efac' },   // Green-300
  ];

  // --- RECHARTS LABEL LOGIC (FIXED) ---
  const RADIAN = Math.PI / 180;
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    // Calculate precise center of the slice ring
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central" // Yeh vertical centering fix karta hai
        className="text-[10px] md:text-xs font-bold pointer-events-none" // Tailwind classes for sizing
        style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.2)' }} // Thoda shadow taaki readable ho
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // --- OTHER DATA ---
  const stats = [
    { label: 'Total Worked Hours', value: '148h 59m' },
    { label: 'Productive Hours', value: '135h 14m' },
    { label: 'Productive %', value: '91%' },
    { label: 'Idle Time Spent', value: '38h 12m' },
  ];

  const barData = [
    { label: 'Apr 30', val: 7, idle: 0 }, { label: 'Apr 29', val: 8, idle: 0 },
    { label: 'Apr 28', val: 7.2, idle: 0.2 }, { label: 'Apr 27', val: 7.2, idle: 0 },
    { label: 'Apr 26', val: 3, idle: 0 }, { label: 'Apr 24', val: 7.2, idle: 0 },
    { label: 'Apr 23', val: 5, idle: 0 }, { label: 'Apr 21', val: 7, idle: 3 },
    { label: 'Apr 20', val: 3.5, idle: 0 }, { label: 'Apr 15', val: 8, idle: 6 },
    { label: 'Apr 14', val: 5, idle: 0 }, { label: 'Apr 10', val: 5, idle: 0 },
    { label: 'Apr 03', val: 8, idle: 0.2 },
  ];

  const apps = [
    { name: 'WerFault', status: 'neutral', bg: 'bg-purple-100', border: 'border-purple-200', text: 'neutral' },
    { name: '3dsmax', status: 'productive', bg: 'bg-blue-50', border: 'border-blue-100', text: 'productive' },
    { name: 'Photo', status: 'productive', bg: 'bg-green-100', border: 'border-green-200', text: 'productive' },
    { name: 'ApplicationFrame', status: 'neutral', bg: 'bg-indigo-100', border: 'border-indigo-200', text: 'neutral' },
    { name: 'explorer', status: 'productive', bg: 'bg-orange-100', border: 'border-orange-200', text: 'productive' },
  ];

  return (
    <div className="w-full bg-gray-50 p-6 font-sans text-gray-800">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-200">
           <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Vishnu" alt="User" className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vishnu Rajan</h1>
          <p className="text-sm text-green-600">vishnurajan@designqubearchitects.com</p>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 mb-1 font-semibold">{stat.label}</p>
            <h2 className="text-2xl font-bold text-gray-800">{stat.value}</h2>
          </div>
        ))}
      </div>

      {/* BAR CHART */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h3 className="text-gray-600 font-medium text-sm mb-6">Activities</h3>
        <div className="relative w-full h-64">
           {/* Background Lines */}
          <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-gray-400 font-medium z-0">
             <div className="border-b border-gray-200 w-full h-0"><span className="bg-white pr-2 relative -top-2">10 hours</span></div>
             <div className="border-b border-gray-200 w-full h-0"><span className="bg-white pr-2 relative -top-2">5 hours</span></div>
             <div className="border-b border-gray-200 w-full h-0"><span className="bg-white pr-2 relative -top-2">0 hours</span></div>
          </div>
          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between pl-12 pt-4 z-10">
             {barData.map((item, idx) => (
                 <div key={idx} className="flex flex-col items-center w-full h-full justify-end">
                    <div className="w-2 sm:w-3 md:w-4 bg-teal-500 rounded-t-sm relative overflow-hidden" style={{height: `${(item.val/10)*100}%`}}>
                       <div className="bg-gray-500 w-full absolute top-0" style={{height: `${(item.idle/item.val)*100}%`}}></div>
                    </div>
                    <div className="mt-2 text-[9px] text-gray-400 text-center leading-tight">
                        {item.label.split(' ')[0]}<br/>{item.label.split(' ')[1]}
                    </div>
                 </div>
             ))}
          </div>
        </div>
      </div>

      {/* APPS & PIE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Apps */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-gray-700 font-medium text-sm mb-5">Used Apps and Websites</h3>
          <div className="space-y-3">
            {apps.map((app, i) => (
              <div key={i} className={`flex items-center justify-between px-4 py-2 rounded-md border ${app.bg} ${app.border}`}>
                <div className="flex items-center gap-3">
                   <span className="text-lg opacity-70">🔹</span>
                   <span className="text-sm font-medium text-gray-700">{app.name}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${app.text === 'productive' ? 'text-green-600' : 'text-purple-600'}`}>
                    {app.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RECHARTS PIE - FIXED */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center relative min-h-[350px]">
           
           <div className="w-full h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    // Yahan changes kiye hain ring ko mota karne ke liye:
                    innerRadius={70}  // Andar ka circle chota kiya
                    outerRadius={120} // Bahar ka circle bada kiya
                    dataKey="value"
                    startAngle={90}   // Chart ko thoda ghuma diya taaki 12 baje se shuru ho
                    endAngle={-270}
                  >
                    {finalPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
           </div>

           {/* Chat Button */}
           <div className="absolute bottom-4 right-4 bg-blue-500 p-3 rounded-full shadow-lg cursor-pointer">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
           </div>

        </div>
      </div>
    </div>
  )
}

export default TrackingDashboard