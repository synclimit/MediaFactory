import React from 'react';

export default function AssetJobItem({ job, onRemove }) {
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
        <div className="bg-[#1a1d27] border border-[#2d3247] hover:border-[#3e445f] p-3 rounded-lg flex flex-col gap-2 transition-all group/item">
            <div className="flex justify-between items-center gap-3">
                <div className="text-[12px] text-gray-200 font-medium truncate flex-1" title={job.filePath}>
                    {job.fileName}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                    <div className={`text-[10px] font-bold uppercase ${statusColor}`}>
                        {job.status}
                    </div>

                    {onRemove && !isActive && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(job.id);
                            }}
                            className="p-1 rounded bg-black/40 hover:bg-red-500/20 text-gray-500 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
                            title="Hapus file ini dari pipeline"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
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
