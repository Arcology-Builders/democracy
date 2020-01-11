import React from 'react';

const LandingHeading = () => {
    return (
      <header className="db-header w-100 text-white">
        <div className="db-logo-div w-100 flex items-end justify-between">
            <img src="/assets/emphasis-caption.png" alt="caption" 
                className="lg:w-1/3 flex-grow-0 self-stretch pl-5 py-5" 
                style={{objectFit:'contain'}}/>
            <div className="crypt-image"></div>
        </div>

        <nav className="db-connection-bar flex justify-between w-100 px-5 py-2">
          <div className="items-end text-gray-500 text-sm">
            Powered by{" "}
            <span className="text-white text-base"> Democracy.js</span>
          </div>
          <div className="flex items-center">
            <img src="/assets/info-icon.png" alt="info" />
            <span className="text-white mx-1 text-sm ml-5">
              You are connected to :
            </span>
            <div className="db-name-cont flex items-center bg-gray-500 self-stretch px-3">
              <span className="connected"></span>
              <span className="text-white text-sm uppercase px-2">rinkeby</span>
              <i className="fa fa-caret-down text-white"></i>
            </div>
          </div>
        </nav>
      </header>
    );
}

export default LandingHeading;