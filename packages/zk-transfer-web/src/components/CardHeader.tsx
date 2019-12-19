import React from 'react';

const CardHeader = (props: any) => {
    return (
        <div className="wallet-name-cont my-5 flex flex-col items-center
            justify-center bg-white shadow-lg p-1">
            <div className="wallet-logo-cont -mt-5">
                <img src={props.image} alt="" />
            </div>
            <p className="mt-1 text-lg">{props.label}</p>
        </div>
    );
}

export default CardHeader;
