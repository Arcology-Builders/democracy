import React from "react";

const StaticContent = () => {
  return (
    <>
      <div className="info-container flex justify-center items-center my-8">
        <div className="w-1/2">
          <h2 className="text-center text-2xl py-8">So how does it work?</h2>
          <p>
            Webtwo ipsum dogster nuvvo flickr greplin, cuil voki. Scribd plugg
            spock cotweet, udemy. glogster. Cuil odeo tumblr, mobly. Zapier elgg
            oooooc joost meebo greplin, zanga vuvox revver zimbra zapier bubbli,
            voki jajah quora kno. Yuntaa bitly quora woopra quora, mozy zoho.
            Mog spotify zooomr voki bebo nuvvo, lanyrd gsnap rovio mog, balihoo
            vimeo trulia disqus. Yoono geni koofers fleck jabber zapier jumo,
            elgg glogster voxy cotweet. Skype glogster convore waze, skype
          </p>

          <h2 className="text-center text-2xl py-8">
            Why do we need private transactions?
          </h2>
          <p>
            Webtwo ipsum dogster nuvvo flickr greplin, cuil voki. Scribd plugg
            spock cotweet, udemy. glogster. Cuil odeo tumblr, mobly. Zapier elgg
            oooooc joost meebo greplin, zanga vuvox revver zimbra zapier bubbli,
            voki jajah quora kno. Yuntaa bitly quora woopra quora, mozy zoho.
            Mog spotify zooomr voki bebo nuvvo, lanyrd gsnap rovio mog, balihoo
            vimeo trulia disqus. Yoono geni koofers fleck jabber zapier jumo,
            elgg glogster voxy cotweet. Skype glogster convore waze, skype
          </p>

          <h2 className="text-center text-2xl py-8">Who is building this?</h2>
          <p>
            Webtwo ipsum dogster nuvvo flickr greplin, cuil voki. Scribd plugg
            spock cotweet, udemy. glogster. Cuil odeo tumblr, mobly. Zapier elgg
            oooooc joost meebo greplin, zanga vuvox revver zimbra zapier bubbli,
            voki jajah quora kno. Yuntaa bitly quora woopra quora, mozy zoho.
            Mog spotify zooomr voki bebo nuvvo, lanyrd gsnap rovio mog, balihoo
            vimeo trulia disqus. Yoono geni koofers fleck jabber zapier jumo,
            elgg glogster voxy cotweet. Skype glogster convore waze, skype
          </p>
        </div>
      </div>
      <footer className="h-48 flex justify-center items-end mb-2">
        <div className="logo-cont flex flex-col items-center">
          <p className="text-center">
            Powered by  <br/>
            <span className="text-xl font-bold">Democracy.js</span>
          </p>
          <div className="flex py-2">
            <img
              src="/assets/ethereum-democracy.png"
              alt="ethereum-democracy"
            />
            <img src="/assets/RealBlocks -logo.png" alt="RealBlocks-logo" />
          </div>
          <img src="/assets/aztec-logo.png" alt="aztec-logo" className="py-2" />
        </div>
      </footer>
    </>
  );
};

export default StaticContent;
