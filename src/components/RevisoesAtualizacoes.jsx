import React, { useState } from 'react';
import { RefreshCw, Calendar, FileText, ChevronRight, Filter } from 'lucide-react';

export default function RevisoesAtualizacoes({ db }) {
  const [revisoes] = useState(db.revisoesAtualizacoes.list());

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Resumo da Governança de Revisões */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Central de Revisões Periódicas e Auditoria</h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 max-w-2xl leading-relaxed">
            De acordo com os requisitos da ISO 22301, todos os Planos de Continuidade (PCO) e Planos de Recuperação de Desastres (PRD) devem passar por revisões estruturadas a cada 6 meses, ou imediatamente após mudanças significativas de infraestrutura de TI ou processos corporativos.
          </p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-950/20 px-4 py-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900/50 flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-indigo-650 dark:text-indigo-450" />
          <div className="text-xs">
            <p className="font-extrabold text-indigo-900 dark:text-indigo-250 uppercase tracking-widest text-[9px]">Revisões Totais</p>
            <p className="font-bold text-slate-800 dark:text-white">{revisoes.length} logs registrados</p>
          </div>
        </div>
      </div>

      {/* Linha do tempo de revisões e auditoria */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-white">Trilha de Auditoria e Versionamento (ISO 22301)</h3>
        </div>
        
        {revisoes.length > 0 ? (
          <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-8 my-6 space-y-8 pr-8">
            {revisoes.map((rev) => {
              const pcoInfo = rev.pco;
              const prdInfo = rev.prd;
              const procNome = pcoInfo?.processo?.nome || prdInfo?.processo?.nome || 'Processo Geral';
              const versaoRef = pcoInfo?.versao || '1.0.0';

              return (
                <div key={rev.id_revisao} className="relative pl-6">
                  {/* Marcador na linha do tempo */}
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900 ring-2 ring-indigo-500/20"></span>
                  
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-xl border border-slate-200 dark:border-slate-850/60 space-y-3 hover:border-indigo-500/30 transition-all">
                    
                    {/* Cabeçalho do Log */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">{rev.id_revisao}</span>
                        <h4 className="font-bold text-slate-800 dark:text-white text-xs mt-0.5">
                          Revisão do Processo: {procNome}
                        </h4>
                      </div>
                      <div className="flex gap-2 whitespace-nowrap text-[10px]">
                        <span className="bg-indigo-15/60 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-bold">
                          PCO v{versaoRef}
                        </span>
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {rev.data_revisao}
                        </span>
                      </div>
                    </div>

                    {/* Conteúdo do Log */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Motivo / Gatilho da Alteração</p>
                        <p className="text-slate-700 dark:text-slate-350 mt-1 leading-relaxed">{rev.motivo}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Atualizações Executadas</p>
                        <p className="text-slate-700 dark:text-slate-350 mt-1 leading-relaxed">{rev.atualizacao_realizada}</p>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 italic">
            Nenhuma revisão estruturada registrada. Atualize um plano PCO/PRD na seção anterior para gerar logs automaticamente.
          </div>
        )}
      </div>

    </div>
  );
}
