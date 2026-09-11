import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react';
import { Category } from '../types/index';

export const EditorPage: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<Category>(Category.INTRODUCAO);
    const [content, setContent] = useState('');

    return (
        <div className="max-w-screen-2xl 3xl:max-w-[2100px] mx-auto space-y-6 2xl:space-y-10 p-4 2xl:p-8">
            <header className="flex items-center justify-between border-b border-border pb-6 2xl:pb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin')}
                        className="p-2 hover:bg-selection rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-serif text-text-main">Editor de Artigo</h1>
                        <p className="text-sm text-text-muted mt-1">Crie ou edite o conteúdo do artigo</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => navigate('/admin')}
                        className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition-colors"
                    >
                        Cancelar
                    </button>
                    <button className="flex items-center gap-2 bg-text-main text-bg-main px-5 py-2 rounded-lg font-medium hover:opacity-90 transition-colors">
                        <Save size={16} /> Publicar
                    </button>
                </div>
            </header>

            <div className="space-y-6">
                {/* Meta Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Título da Dúvida/Artigo</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Como configurar a VPN da clínica?"
                            className="w-full bg-bg-island border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-text-main transition-colors text-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted">Categoria</label>
                        <select 
                            value={category}
                            onChange={(e) => setCategory(e.target.value as Category)}
                            className="w-full bg-bg-island border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-text-main transition-colors"
                        >
                            {Object.values(Category).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Editor Toolbar e Textarea */}
                <div className="border border-border rounded-xl overflow-hidden flex flex-col bg-bg-island">
                    <div className="flex items-center gap-2 p-2 border-b border-border bg-selection/30">
                        <select className="bg-transparent text-sm border-none focus:ring-0 text-text-main py-1 px-2 cursor-pointer outline-none">
                            <option className="bg-bg-main">Normal Text</option>
                            <option className="bg-bg-main">Heading 1</option>
                            <option className="bg-bg-main">Heading 2</option>
                        </select>
                        <div className="w-[1px] h-4 bg-border mx-2" />
                        <button className="p-1.5 hover:bg-selection rounded font-serif font-bold w-8 text-center text-text-main">B</button>
                        <button className="p-1.5 hover:bg-selection rounded font-serif italic w-8 text-center text-text-main">I</button>
                        <div className="w-[1px] h-4 bg-border mx-2" />
                        <button className="p-1.5 hover:bg-selection rounded text-text-main flex items-center justify-center w-8" title="Adicionar Imagem Full Bleed">
                            <ImageIcon size={16} />
                        </button>
                    </div>
                    
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Escreva o conteúdo do artigo aqui..."
                        className="w-full p-6 min-h-[500px] bg-transparent resize-y focus:outline-none text-text-main leading-relaxed"
                    />
                </div>
            </div>
        </div>
    );
};
