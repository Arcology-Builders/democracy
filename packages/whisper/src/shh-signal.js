const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://34.216.164.61:8546'))
const signalClient = new ShhSignalClient(web3) // Uses an existing web3 instance

var localStream;

function onPeer(id, peer, metadata) {
	console.log('connected to peer with ID', id, 'and metadata', metadata)
	const videoElement = document.createElement('video')
	videoElement.autoplay = true
	document.body.appendChild(videoElement)
	peer.on('stream', (stream) => {
		console.log('got stream')
		videoElement.srcObject = stream
	})
	var removed = false
	peer.on('close', () => {
		if (removed) return
		removed = true
		document.body.removeChild(videoElement)
	})
	peer.on('error', () => {
		peer.destroy()
		if (removed) return
		removed = true
		document.body.removeChild(videoElement)
	})
}

document.querySelector('button').addEventListener('click', () => {
	navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
		document.body.removeChild(document.querySelector('button'))
		
		localStream = stream
		const videoElement = document.getElementById('localvideo')
		videoElement.autoplay = true
		videoElement.srcObject = localStream;
		signalClient.discover('hello!')

		signalClient.on('discover', async (newID, discoveryData) => {
			console.log('discovered peer with ID', newID, 'and discoveryData', discoveryData)
			const { peer, metadata } = await signalClient.connect(newID, { any: 'data' }, { trickle: false, stream: localStream }) // connect to all new clients 
			onPeer(newID, peer, metadata)
		})

		signalClient.on('request', async (request) => {
			const { peer, metadata } = await request.accept({ some: 'random metadata' }, { trickle: false, stream: localStream }) // Accept all incoming requests to connect
			onPeer(request.initiator, peer, metadata)
		})
	}).catch((err) => console.error(err))
})
