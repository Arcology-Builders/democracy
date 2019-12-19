import React from 'react';
import sendIcon from "../assets/send-icon.svg";

type UserListProp = {
    name: string,
    image: string,
    onSend: Function,
}

const UserList = ({ name, image, onSend }: UserListProp) => {
    return (
    <li className="user-item flex justify-between items-center text-sm my-2"
        onClick={() => onSend()}>
        <img src={image} alt={name + ' image'}/>
        <span className="flex-1 name px-5">{name}</span>
        <img src={sendIcon} alt="" className="w-4 h-4" />
    </li>
    );
}

export default UserList 