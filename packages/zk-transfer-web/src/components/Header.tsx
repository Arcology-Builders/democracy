import React from 'react';
import { useStore } from '../hooks/useDemo'
import { CopyIcon } from '../components/Icons'

const Header = () => {
	const { demo, screenName } = useStore();
	const thisAddress = demo?.thisAddress 
	
	const show = thisAddress ? ' ' : ' -translate-x-full '

    return (
      <header className="fixed top-0 w-full flex justify-between h-auto select-none z-10">
      	<div className={`bg-white px-4 py-2 mt-4 
      		rounded-r-large 
      		inline-flex items-center 
      		absolute top-0 shadow-xl w-auto mx-auto duration-500 ease-out 
      		transition-transform transform `  + show }>
			<img src="/assets/avatar.png" alt="avatar" className="w-10 h-10 mr-4"/>
            <ul className="flex color3 text-sm">
				<li className="flex hidden items-center">
					<img src="/assets/retweet.png" alt="retweet" className="icons" />
					<p className="color2">
					  <span
					    className="color3 text-xs cursor-pointer hover:underline"
					    onClick={() => {}}
					  >
					    (click to edit)
					  </span>
					</p>
				</li>

              <li className="flex flex-col text-sm">
                <span className="text-black">{ screenName || 'Name Here'} </span>
                {thisAddress 
                    ? 	(<div className="flex items-center">
	                    	<a
			                    href={`https://rinkeby.etherscan.io/address/${thisAddress}`}
			                    rel="noopener noreferrer"
			                    className="opacity-75 text-accent"
			                    target="_blank"
			                    >
			                    {thisAddress.split("").filter((e, idx) => idx < 18).join("") + "..."}
		                    </a>
		                    <CopyIcon />
	                    </div>)
                    : <span className="opacity-75 text-accent">No Ethereum address found.</span>
                }
              </li>
              <li className="flex hidden items-center">
                <img src="/assets/sound.png" alt="" className="icons w-8 h-8 px-3" />
              </li>
              <li className="flex justify-center items-center px-3 ml-4">
                <span className="rounded-full border-_3 border-2 w-8 h-8"></span>
                <span className="text-center absolute text-xs text-gray-900">mainnet</span>
              </li>
            </ul>
        </div>
	        <div
	          className="socials-container flex flex-1 justify-end p-4"
	          style={{ right: 0 }}
	        >
	          <a style={{ filter: "invert(1)" }} href="//www.github.com">
	            <img
	              alt="Github Logo"
	              src="/assets/github-logo.svg"
	              className="w-8 h-8 mr-4"
	            />
	          </a>
	          <a style={{ filter: "invert(1)" }} href="//medium.com">
	            <img
	              alt="Medium Logo"
	              src="/assets/medium-logo.svg"
	              className="w-8 h-8"
	            />
	          </a>
	        </div>
      </header>
    );
}

export default Header;