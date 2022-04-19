
const algodClient = new algosdk.Algodv2("",'https://node.algoexplorerapi.io', '');

async function connect() {

    const myAlgoConnect = new MyAlgoConnect();
    const accountsSharedByUser = await myAlgoConnect.connect({shouldSelectOneAccount: true, openManager: false});

    const userAddress = accountsSharedByUser[0].address;

    const list = await loadList();

    const params = await algodClient.getTransactionParams().do();

    if (list[userAddress] !== undefined){

        assetsToAdd = list[userAddress];

        const dialogConnect = document.querySelector("#dialog-connect");
        dialogConnect.hidden = true;

        const dialogOptinAuto = document.querySelector("#dialog-optin");
        dialogOptinAuto.hidden = false;
        
        const addressSpan = document.querySelector("#dialog-optin #address");
        addressSpan.textContent = userAddress

        const assetsSpan = document.querySelector("#dialog-optin #assets");
        assetsSpan.textContent = assetsToAdd.join(", ");

        const addAssetButton = document.querySelector("#dialog-optin button")
        addAssetButton.onclick = () => {

            optinAuto(userAddress, assetsToAdd, params)
        }

    } else {

        const dialogConnect = document.querySelector("#dialog-connect");
        dialogConnect.hidden = true;

        const dialogNotEligible = document.querySelector("#dialog-not-eligible");
        dialogNotEligible.hidden = false;

        const addressSpan = document.querySelector("#dialog-not-eligible #address");
        addressSpan.textContent = userAddress

        console.log(`${userAddress} not eligible`)
    }

}

async function loadList() {

    const list = await fetch("./list.json");
    return list.json();

}

function optinAuto(address, assets, params) {
 
    let transactions = []

    for(const asset of assets){

        const txn = algosdk.makeAssetTransferTxnWithSuggestedParams(
            address,
            address,
            undefined,
            undefined,
            0,
            undefined,
            asset,
            params
        );

        transactions.push(txn);

    }

    const myAlgoConnect = new MyAlgoConnect();
    myAlgoConnect.signTransaction(transactions.map(txn => txn.toByte())).then(signedTxn => {
        console.log("complete")
        sendSignedTransaction(signedTxn)
    }).catch(err => {
        alert(err)
        console.log(err);
    })
    
}

async function sendSignedTransaction(signedTxn){


    const dialogOptinAuto = document.querySelector("#dialog-optin")
    dialogOptinAuto.hidden = true

    const dialogBusy = document.querySelector("#dialog-busy")
    dialogBusy.hidden = false

    const message = document.querySelector("#dialog-busy #message")

    console.log(signedTxn)

    try { 

        let current = 1;
        let num = signedTxn.length;

        for(const txn of signedTxn){

            message.innerHTML = `Adding asset ${current}/${num}... <br>Please keep this page open until all assets have been added.`;

            const opttx = await algodClient.sendRawTransaction(txn.blob).do();
            const confirmedTxn = await algosdk.waitForConfirmation(algodClient, opttx.txId, 4);

            console.log("Transaction " + opttx.txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

            current++;
        }

        message.textContent = "All assets added! You can now safely close this page.";
        

    } catch (err) {

        message.textContent = "Error: "+err;
    }

    //remove spinner
    const spinner = document.querySelector(".spinner-border")
    spinner.hidden = true

    

}

async function addManually(){
    console.log("add manually")

    const dialogConnect = document.querySelector("#dialog-connect");
    dialogConnect.hidden = true;

    const dialogOptinAuto = document.querySelector("#dialog-add-manually");
    dialogOptinAuto.hidden = false;

    const button = document.querySelector("#dialog-add-manually button");

    button.onclick = async () => {

        const userAddress = document.querySelector("#dialog-add-manually input").value;

        //check that address is a valid algo address
        if (!algosdk.isValidAddress(userAddress)){
            alert(`${userAddress} is not a valid Algorand address`)
            return
        }

        const list = await loadList();

        if (list[userAddress] !== undefined){

            assetsToAdd = list[userAddress];
    
            const dialogConnect = document.querySelector("#dialog-add-manually");
            dialogConnect.hidden = true;
    
            const dialogOptinAuto = document.querySelector("#dialog-optin");
            dialogOptinAuto.hidden = false;
            
            const addressSpan = document.querySelector("#dialog-optin #address");
            addressSpan.textContent = userAddress
    
            const assetsSpan = document.querySelector("#dialog-optin #assets");
            assetsSpan.textContent = assetsToAdd.join(", ");
    
            const addAssetButton = document.querySelector("#dialog-optin button")
            addAssetButton.hidden = true
    
        } else {
    
            const dialogOptinAuto = document.querySelector("#dialog-add-manually");
            dialogOptinAuto.hidden = true;
    
            const dialogNotEligible = document.querySelector("#dialog-not-eligible");
            dialogNotEligible.hidden = false;
    
            const addressSpan = document.querySelector("#dialog-not-eligible #address");
            addressSpan.textContent = userAddress
    
            console.log(`${userAddress} not eligible`)
        }
        


    }
}

window.addEventListener("DOMContentLoaded", (event) => {

    const dialogMainLoading = document.querySelector("#dialog-main-loading");
    dialogMainLoading.hidden = true

    const dialogConnect = document.querySelector("#dialog-connect");
    dialogConnect.hidden = false

    //enable connect button
    const connectButton = document.querySelector("#dialog-connect button");
    connectButton.addEventListener("click", connect);

    //enable manual adding
    const manualButton = document.querySelector("#dialog-connect #add-manually")
    manualButton.addEventListener("click", addManually);

  })

