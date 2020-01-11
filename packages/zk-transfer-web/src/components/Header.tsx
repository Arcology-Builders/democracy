import React from 'react';
import { shortenAddress } from '../helpers/account';

const Header = ({ thisAddress }: { thisAddress: string }) => {
    return (
        <header className="bg-white w-100 flex justify-between items-center shadow p-5">
            <div className="user-info flex items-center flex-1" style={{left: 0}}>
                <div className="avatar">
                    <img src="/assets/avatar.png" alt="avatar" />
                </div>
                <div className="acc-info px-2 flex-1">
                    <ul className="color3 text-sm">
                        <li className="flex items-center">
                            <img src="/assets/retweet.png" alt="" className="icons" />
                            <p className="color2">James Cameron &nbsp;
                                <span className="color3 text-xs cursor-pointer hover:underline" onClick={() => {}}>(click to edit)</span>
                            </p>
                        </li>
                        <li className="flex items-center">
                            <img src="/assets/logo-ether.png" className="icons" alt="ether"/>
                            <a href="https://rinkeby.etherscan.io" 
                                rel="noopener noreferrer"
                                target="_blank">
                                { shortenAddress(thisAddress) }
                            </a>
                        </li>
                        <li className="flex items-center">
                            <span className="bg-green icons"></span>
                            <span>Mainnet</span>
                        </li>
                        <li className="flex items-center">
                            <img src="/assets/sound.png" alt="" className="icons" />
                            <span>Sound on</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="header text-center flex-1">
                <p className="text-4xl">Zero-Knowledge Assets</p>
                <p className="text-lg">Send crypto privately!</p>
            </div>
            <div className="socials-container flex flex-1 justify-end" style={{ right: 0 }}>
                <a href="//www.github.com">
                    <img alt="Github Logo" src="/assets/github-logo.svg" className="w-8 h-8 mr-4" /></a>
                <a href="//medium.com">
                    <img alt="Medium Logo" src="/assets/medium-logo.svg" className="w-8 h-8" /></a>
            </div>
        </header>
    );
}

export default Header;