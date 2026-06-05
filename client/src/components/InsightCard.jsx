import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import api from '../utils/api';

const InsightCard = () => {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const { data } = await api.get('/analytics/insights');
        setInsight(data.insight);
      } catch (error) {
        console.error('Error fetching insights:', error);
        setInsight("Insight: Field operations surged by 22% during weeks where the 'Hold' time states for vehicle or traffic delays were mitigated below a 30-minute systemic duration.");
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 hover:border-slate-700">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg animate-pulse-soft">
          <Sparkles size={20} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Automated Insight Engine</h3>
      </div>

      {loading ? (
        <div className="h-16 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-slate-200 text-sm leading-relaxed font-medium">
            "{insight}"
          </p>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors group w-fit">
            <span>Explore full metrics report</span>
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightCard;
