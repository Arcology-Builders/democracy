import React from 'react'

type TxCardProps = {
    active: boolean;
    children: any;
}

const Card = (props: TxCardProps ) => {
    const fade = (a: boolean) => a ? 'shadow-2xl' : 'opacity-75 shadow-lg pointer-events-none';

    return (
        <div className={`${fade(props.active)} choose-token-container flex flex-1 w-full bg-white rounded-lg p-10`}>
            { props.children }
        </div>
    )
}

export default Card;