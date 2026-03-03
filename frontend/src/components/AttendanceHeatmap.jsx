import { useState, useEffect } from 'react';

/**
 * GitHub-style attendance heatmap component
 * Shows a grid of colored squares representing daily attendance over the last 6 months
 */
const AttendanceHeatmap = ({ data = [] }) => {
    const [cellData, setCellData] = useState([]);

    useEffect(() => {
        generateCells();
    }, [data]);

    const generateCells = () => {
        const today = new Date();
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Create a map from data
        const dataMap = {};
        data.forEach(d => {
            dataMap[d.date] = d;
        });

        const cells = [];
        const current = new Date(sixMonthsAgo);
        while (current <= today) {
            const dateStr = current.toISOString().split('T')[0];
            const dayData = dataMap[dateStr];
            cells.push({
                date: dateStr,
                day: current.getDay(),
                present: dayData?.present || 0,
                absent: dayData?.absent || 0,
                total: dayData?.total || 0,
                displayDate: current.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            });
            current.setDate(current.getDate() + 1);
        }
        setCellData(cells);
    };

    const getColor = (cell) => {
        if (cell.total === 0) return 'var(--gray-200)';
        const ratio = cell.present / cell.total;
        if (ratio >= 0.9) return '#22c55e';
        if (ratio >= 0.75) return '#86efac';
        if (ratio >= 0.5) return '#fbbf24';
        if (ratio > 0) return '#f87171';
        return '#ef4444';
    };

    // Group by weeks
    const weeks = [];
    let currentWeek = [];
    cellData.forEach((cell, i) => {
        if (cell.day === 0 && currentWeek.length > 0) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
        currentWeek.push(cell);
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

    return (
        <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '2px', minWidth: 'fit-content' }}>
                {/* Day labels */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px', justifyContent: 'flex-start' }}>
                    {days.map((d, i) => (
                        <div key={i} style={{ height: '14px', fontSize: '10px', color: 'var(--gray-500)', lineHeight: '14px' }}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Cells */}
                {weeks.map((week, wi) => (
                    <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {week.map((cell, ci) => (
                            <div
                                key={ci}
                                title={`${cell.displayDate}: ${cell.present} present, ${cell.absent} absent`}
                                style={{
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '2px',
                                    backgroundColor: getColor(cell),
                                    cursor: 'pointer',
                                    transition: 'transform 0.15s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.transform = 'scale(1.3)'}
                                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            />
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '11px', color: 'var(--gray-500)' }}>
                <span>Less</span>
                {['var(--gray-200)', '#ef4444', '#f87171', '#fbbf24', '#86efac', '#22c55e'].map((color, i) => (
                    <div key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: color }} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
};

export default AttendanceHeatmap;
