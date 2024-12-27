import { useState } from "react";
import ModalAlert from "./ModalAlert";


interface ErrorAlertProps {
    message: string
}

const ErrorAlert: React.FC<ErrorAlertProps> = (message) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    let d_message: string = message.message;

    const handleModalConfirm = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <ModalAlert
                isOpen={isModalOpen}
                onConfirm={handleModalConfirm}
                title="Error"
                imageSrc="/ui/galat_img.svg"
            >
                <p>{d_message}</p>
            </ModalAlert>
        </>
    );
}

export default ErrorAlert;