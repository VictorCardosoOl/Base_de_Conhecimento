import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Settings, Trash2, Edit } from 'lucide-react';
import { FAQ_DATA } from '../constants/index';

export const AdminPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-serif text-text-main">Painel Administrativo</h1>
                    <p className="text-text-muted mt-1">Gerencie os artigos da Base de Conhecimento</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => {
                            localStorage.removeItem('isAdmin');
                            navigate('/login');
                        }}
                        className="flex items-center gap-2 border border-border text-text-main px-4 py-2 rounded-lg font-medium hover:bg-selection transition-colors"
                    >
                        Sair
                    </button>
                    <button 
                        onClick={() => navigate('/admin/editor')}
                        className="flex items-center gap-2 bg-text-main text-bg-main px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus size={18} /> Novo Artigo
                    </button>
                </div>
            </header>

            <div className="bg-bg-island border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-selection/30 border-b border-border text-sm text-text-muted uppercase tracking-wider">
                                <th className="p-4 font-medium">Artigo</th>
                                <th className="p-4 font-medium">Categoria</th>
                                <th className="p-4 font-medium">Data</th>
                                <th className="p-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {FAQ_DATA.slice(0, 10).map((item) => (
                                <tr key={item.id} className="hover:bg-selection/20 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <FileText size={16} className="text-text-muted" />
                                            <span className="font-medium text-text-main line-clamp-1">{item.question}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-text-muted">
                                        <span className="px-2 py-1 bg-selection/30 rounded-md text-xs">{item.category}</span>
                                    </td>
                                    <td className="p-4 text-sm text-text-muted">{item.date}</td>
                                    <td className="p-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => navigate('/admin/editor')} className="p-2 text-text-muted hover:text-text-main rounded-lg hover:bg-selection transition-colors">
                                                <Edit size={16} />
                                            </button>
                                            <button className="p-2 text-text-muted hover:text-red-600 rounded-lg hover:bg-red-500/20 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
