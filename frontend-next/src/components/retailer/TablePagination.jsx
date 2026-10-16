"use client";

import React from "react";

export default function TablePagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 6,
  onPageChange,
  isLight = false,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, currentPage * pageSize);

  if (totalItems <= pageSize && currentPage === 1) {
    return (
      <div className={`flex items-center justify-between pt-4 border-t ${isLight ? "border-neutral-200 text-neutral-500" : "border-neutral-800/80 text-neutral-400"} text-xs`}>
        <span>Showing all {totalItems} items</span>
        <span className="font-normal">Page 1 of 1</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t ${isLight ? "border-neutral-200" : "border-neutral-800/80"} text-xs`}>
      <span className={isLight ? "text-neutral-500" : "text-neutral-400"}>
        Showing {startIndex}–{endIndex} of {totalItems} items
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            currentPage <= 1
              ? "opacity-30 cursor-not-allowed text-neutral-400"
              : isLight
              ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 active:scale-95"
              : "bg-[#181a22] hover:bg-[#20222c] text-neutral-200 active:scale-95 border border-neutral-800"
          }`}
        >
          Previous
        </button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            // Only show nearby pages if there are many pages
            if (
              totalPages > 7 &&
              page !== 1 &&
              page !== totalPages &&
              Math.abs(page - currentPage) > 1
            ) {
              if (page === 2 || page === totalPages - 1) {
                return (
                  <span key={page} className="px-1 text-neutral-500">
                    &hellip;
                  </span>
                );
              }
              return null;
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`w-7 h-7 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? isLight
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "bg-white text-black shadow-sm"
                    : isLight
                    ? "text-neutral-600 hover:bg-neutral-100"
                    : "text-neutral-400 hover:bg-[#181a22]"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            currentPage >= totalPages
              ? "opacity-30 cursor-not-allowed text-neutral-400"
              : isLight
              ? "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 active:scale-95"
              : "bg-[#181a22] hover:bg-[#20222c] text-neutral-200 active:scale-95 border border-neutral-800"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
