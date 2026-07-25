import React from 'react';

export default function AssetJobItem({ job }) {
    const isCompleted = job.status === 'Completed';
    const isSkipped = job.status === 'Skipped';
    const isFailed = job.status === 'Failed';
    const isCancelled = job.status === 'Cancelled';
    const isPending = job.status === 'Pending';
    const isActive = !isCompleted && !isSkipped && !isFailed && !isCancelled && !isPending;

    // Progress mapping (rough estimate based on status)
    const statusMap = {
        'Pending': 0,
        'Scanning': 10,
        'Metadata': 25,
        'Beat': 50,
        'Whisper': 75,
        'Saving': 90,
        'Completed': 100,
        'Skipped': 100,
        'Failed': 0,
        'Cancelled': 0
    };
    const progress = statusMap[job.status] || 0;

    let statusColor = 'text-gray-400';
    if (isCompleted) statusColor = 'text-emerald-500';
    if (isSkipped) statusColor = 'text-blue-400';
    if (isFailed) statusColor = 'text-red-500';
    if (isCancelled) statusColor = 'text-yellow-500';
    if (isActive) statusColor = 'text-orange-500 animate-pulse';

    return (
        <div className="bg-[#1a1d27] border border-[#2d3247] p-3 rounded-lg flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <div className="text-[12px] text-gray-200 font-medium truncate" title={job.filePath}>
                    {job.fileName}
                </div>
                <div className={`text-[10px] font-bold uppercase ${statusColor}`}>
                    {job.status}
                </div>
            </div>

            {/* Error Message */}
            {isFailed && job.error && (
                <div className="text-[10px] text-red-400 bg-red-950/30 p-1.5 rounded">
                    {job.error}
                </div>
            )}

            {/* Progress Bar */}
            {isActive && (
                <div className="mt-1 h-1 w-full bg-[#0a0b0f] rounded-full overflow-hidden shrink-0 relative">
                    <div 
                        className={`h-full bg-orange-500 transition-all duration-300 ease-out`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}
            {(isCompleted || isSkipped) && (
                <div className="mt-1 h-1 w-full bg-[#0a0b0f] rounded-full overflow-hidden shrink-0">
                    <div className={`h-full ${isSkipped ? 'bg-blue-500' : 'bg-emerald-500'}`} style={{ width: '100%' }}></div>
                </div>
            )}
        </div>
    );
}
