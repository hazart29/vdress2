import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const ModalBox: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed w-full inset-0 bg-black bg-opacity-50 items-center justify-center p-12">
            <div className="bg-white p-4 rounded-lg flex flex-1 flex-col h-full relative">
                <div className='flex flex-none flex-row'>
                    <button
                        className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
                        onClick={onClose}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" className="bi bi-x-lg" viewBox="0 0 16 16">
                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
                        </svg>
                    </button>

                    <h2 className="text-xl font-bold mb-4 text-black">{title}</h2>
                </div>
                {children}
            </div>
        </div>
    );
};

export default ModalBox;