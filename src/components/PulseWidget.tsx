import React, { useState } from 'react';
import { useProduction } from '../context/ProductionContext';
import { RUSSIAN_MONTHS } from '../utils/dateUtils';
import { Sliders, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export const PulseWidget: React.FC = () => {
  const { stats, currentExpertId, experts, activeRole } = useProduction();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const expert = experts.find(e => e.id === currentExpertId) || experts[0];
  const isSuperAdmin = activeRole === 'super_admin';

  const now = new Date();
  const periodText = `${RUSSIAN_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  // Reels
  const reelsDone = stats.reelsReady || 0;
  const reelsPlan = stats.monthPlanReels || 8;
  const reelsPercent = Math.min(100, Math.round((reelsDone / Math.max(1, reelsPlan)) * 100));
  const reelsBufferStock = stats.reelsBufferStock ?? reelsDone;
  const isReelsBufferSafe = reelsBufferStock >= 2;

  // Carousels
  const carouselsDone = stats.carouselsReady || 0;
  const carouselsPlan = stats.monthPlanCarousels || 4;
  const carouselsPercent = Math.min(100, Math.round((carouselsDone / Math.max(1, carouselsPlan)) * 100));
  const carouselsBufferStock = stats.carouselsBufferStock ?? carouselsDone;
  const isCarouselsBufferSafe = carouselsBufferStock >= 2;

  // Stories
  const storiesDone = stats.storiesReady || 0;
  const storiesPlan = stats.monthPlanStories || 8;
  const storiesPercent = Math.min(100, Math.round((storiesDone / Math.max(1, storiesPlan)) * 100));

  return (
    <div className="space-y-1.5">
      {/* Group Header */}
      <div className="flex items-center justify-between ml-4 mr-2">
        <h4 className="text-[13px] font-normal text-[#8E8E93] uppercase tracking-wider">
          План производства • {periodText}
        </h4>
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-[13px] text-[#007AFF] font-medium flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Настроить</span>
          </button>
        )}
      </div>

      {/* iOS Inset Grouped Section */}
      <div className="bg-white rounded-[16px] divide-y divide-[#C6C6C8]/40 overflow-hidden">
        {/* Row 1: Reels */}
        <div className="px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-medium text-black">Reels</span>
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-black font-semibold">
                {reelsDone} из {reelsPlan}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isReelsBufferSafe
                  ? 'bg-[#34C759]/12 text-[#34C759]'
                  : 'bg-[#FF9500]/12 text-[#FF9500]'
              }`}>
                Буфер: {reelsBufferStock}/2
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#767680]/12 rounded-full overflow-hidden">
            <div
              className="bg-[#007AFF] h-full rounded-full transition-all duration-300"
              style={{ width: `${reelsPercent}%` }}
            />
          </div>
        </div>

        {/* Row 2: Carousels */}
        <div className="px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-medium text-black">Карусели</span>
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-black font-semibold">
                {carouselsDone} из {carouselsPlan}
              </span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isCarouselsBufferSafe
                  ? 'bg-[#34C759]/12 text-[#34C759]'
                  : 'bg-[#FF9500]/12 text-[#FF9500]'
              }`}>
                Буфер: {carouselsBufferStock}/2
              </span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#767680]/12 rounded-full overflow-hidden">
            <div
              className="bg-[#007AFF] h-full rounded-full transition-all duration-300"
              style={{ width: `${carouselsPercent}%` }}
            />
          </div>
        </div>

        {/* Row 3: Stories */}
        <div className="px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-medium text-black">Stories</span>
            <span className="text-[14px] text-black font-semibold">
              {storiesDone} из {storiesPlan}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#767680]/12 rounded-full overflow-hidden">
            <div
              className="bg-[#007AFF] h-full rounded-full transition-all duration-300"
              style={{ width: `${storiesPercent}%` }}
            />
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};
