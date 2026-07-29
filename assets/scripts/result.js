export async function loadDynamicData(ordId) {

    let success;
    if(ordId === null) return;

    const response = await fetch(`http://api-pixelstore.vercel.app/api/order/status/${ordId}`);
    if(!response.ok){
        console.log("Fetch err: ", response.message);
        return;
    }

    const stat = await response.json();
    if(response.data === "NOT_PAID") success = false
    else success = true;

    const defaultState = document.getElementById("result-default");
    const successState = document.getElementById("result-success");
    const failureState = document.getElementById("result-failure");

    defaultState.style.display = "none";

    if (success) {
        successState.style.display = "flex";
    }
    else {
        failureState.style.display = "flex";
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const ordId = params.get("ord") || null;
    await loadDynamicData(ordId);
});
