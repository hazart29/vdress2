import React, { useState } from 'react';
import ModalBox from './ModalBox';
import { useRouter } from 'next/navigation';
import HistoryGacha from './HistoryGacha';
import InfoGacha from './InfoGacha';

const MoreBox: React.FC<{ activeTab: string }> = ({ activeTab }) => {
    const [showModal, setShowModal] = useState(0);
    const router = useRouter();

    const handleModalClose = () => {
        setShowModal(0);
    };

    const goToShop = () => {
        router.push('/main/shop')
    }

    return (
        <div className="flex gap-4">
            <button
                onClick={() => goToShop()}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold lg:px-6 px-4 lg:py-2 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-cart3 lg:h-5 h-3" viewBox="0 0 16 16">
                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.465.401l-9.393.472L4.415 11H13a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l.84 4.479 9.144-.459L13.89 4H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                </svg>
            </button>

            <button
                onClick={() => setShowModal(2)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold lg:px-6 px-4 lg:py-2 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-info-circle lg:h-5 h-3" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                    <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>
            </button>

            <button
                onClick={() => setShowModal(3)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold lg:px-6 px-4 lg:py-2 py-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-clock-history lg:h-5 h-3" viewBox="0 0 16 16">
                    <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022l-.074.997zm2.004.45a7.003 7.003 0 0 0-.985-.299l.219-.976c.383.086.76.2 1.126.342l-.36.933zm1.37.71a7.01 7.01 0 0 0-.439-.27l.493-.87a8.025 8.025 0 0 1 .979.654l-.615.789a6.996 6.996 0 0 0-.418-.302zm1.831 1.769a6.99 6.99 0 0 0-.653-.796l.724-.69c.27.285.52.59.747.91l-.818.576zm.744 1.352a7.08 7.08 0 0 0-.214-.468l.893-.45a7.976 7.976 0 0 1 .45 1.088l-.95.313a7.023 7.023 0 0 0-.179-.483zm.53 2.507a6.991 6.991 0 0 0-.1-1.025l.985-.17c.067.386.106.778.116 1.17l-1 .025zm-.131 1.538c.033-.17.06-.339.081-.51l.993.123a7.957 7.957 0 0 1-.23 1.155l-.964-.267c.046-.165.086-.332.12-.501zm-.952 2.379c.184-.29.346-.594.486-.908l.914.405c-.16.36-.345.706-.555 1.038l-.845-.535zm-.964 1.205c.122-.122.239-.248.35-.378l.758.653a8.073 8.073 0 0 1-.401.432l-.707-.707z" />
                    <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0v1z" />
                    <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z" />
                </svg>
            </button>

            <ModalBox isOpen={showModal === 2} onClose={handleModalClose} title="Limited Gacha Time">
                <InfoGacha />
            </ModalBox>

            <ModalBox isOpen={showModal === 3} onClose={handleModalClose} title="History Gacha">
                <HistoryGacha gachaType={activeTab === "standar" ? "Symphony_of_Silk" : "Whispers_of_Silk"} />
            </ModalBox>
        </div>
    );
};

export default MoreBox;