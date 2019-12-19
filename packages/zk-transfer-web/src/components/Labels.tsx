import React from 'react';

type SectionLabelProps = { 
    text: string;
    type?: string;
}

export const SectionLabel = (props: SectionLabelProps) => {
    return (
        <div className="border-b border-gray-200 px-4 mb-2">
            <span className={[props.type || '', "address-label color5 inline-block py-1"].join(' ')}>
                {props.text}
            </span>
        </div>
    );
}

const labelFor = (type: string) => (props: SectionLabelProps) => {
    return <SectionLabel {...props} type={type} />
}

SectionLabel.Online = labelFor('online');
SectionLabel.Offline = labelFor('offline');