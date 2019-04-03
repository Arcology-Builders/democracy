'use strict';

const InvisibleLibrary = require('../src/invisible');
const demo = require('democracy.js')
const assert = require('chai').assert

describe('Invisible Library', () => {
  
  let il 

  before(async() => {
    const eth = demo.getNetwork()
    const networkId = await eth.net_version()
    const deploy = demo.getDeploy(networkId, 'InvisibleLibrary-deploy')
    const accounts = await demo.getAccounts(eth)
    il = new InvisibleLibrary(eth, deploy, accounts[0])
  })

  it('posts an artifact', async () => {
    const prevCount = await il.getArtifactCount()
    const txHash = await il.postArtifact('https://lh3.googleusercontent.com/kvIc7Vi4qt2cFYaRNFZM7dpDEVkgI3z2TSo2_2Zri0MvlsOJHSh8HBuluEu-C79aRcR2buDQ0yKplD_UfNpyWHX8VXGQ0JkUrPOEIKiC5rBb4-J9dk5izS5xoiYe-9NmBCQZahH9wPsd59MXWm_m19nxOvHqb1wvKb5vrvyeA9Fr5_hfvxdAJYlnSMp_Ap0SdQjb80ozgj73_jKOwKYDhG4rm8QnsgNn8y9A9oE9eANDejVADBuF_xHZlhzkuDTK0Yo1R9WmoDT_ZAofyhVSWEaP_1OFFRm_v0edZ4_KzyNDICQt_ecB3PVku4qb7_MKm1dOwH6EPF8MPebtydvUiHKdNb8oqKabPVW4UiDrXchBJWbfCXJ-pGOwbnIotYHdHZqFZWr71DJDwuIpxUf9dRHi2CvqfNmbigVwWQZNgeuZEz0JDZq5UcnH3cmsCpD1_roHha7AkwI_-UGTnYSkBTSoKzwGQISx7cwNinmPCUTluDcOChq1V7wKaAAVCVawRrw4CCt3ib4x7peFBRNKA7Xs9iqRvcMPH12_Yx2dpoKdBTKEdXkb1Yoli-ewMzQgsViM5sZsTdkZeerOVnsEu46ChKL4XW-zNmd6ZAo=w320-h200-k', 'Sentry Safe 50 lbs 18"x18"x18"', 'https://drive.google.com/file/d/1_y58eAxSxVbHcmwW6v1FH2PvJgcjkeKJ/view?usp=sharing')
    const nextCount = await il.getArtifactCount()
    assert.equal(prevCount+1, nextCount, `New artifact should increase count by one`)
  })

  it('retrieves artifacts', async() => {
    const artifacts = await il.getArtifacts()
    const count = await il.getArtifactCount()
    assert.equal(artifacts.length, count, 'Artifact counts not equal')
    //assert.ok(artifacts.first().get('photoURL'))
    //assert.ok(artifacts.first().get('shortDesc'))
    //assert.ok(artifacts.first().get('longDescURL'))
  })
})
