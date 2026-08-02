const openInvoiceWindow = function (url) {
    const invoiceWindow = window.open(url, "_blank", "noopener,noreferrer,menubar=no,toolbar=no,location=no,status=no,height=600,width=960,scrollbars=yes");
    if (invoiceWindow) invoiceWindow.focus();
};

async function loadDynamicData(ordId) {

    let success;
    if (ordId === null) return;

    const response = await fetch(`https://api-pixelstore.vercel.app/api/order/status/${ordId}`);
    if (!response.ok) {
        console.log("Fetch err: ", response.message);
        return;
    }

    const stat = await response.json();
    if (response.data === "NOT_PAID") success = false
    else success = true;

    const defaultState = document.getElementById("result-default");
    const successState = document.getElementById("result-success");
    const failureState = document.getElementById("result-failure");

    defaultState.style.display = "none";

    if (success) {
        successState.style.display = "flex";

        const downloadBtn = document.getElementById("download-invoice-btn");

        downloadBtn.addEventListener("click", function (e) {
            e.preventDefault();
            openInvoiceWindow(`https://api-pixelstore.vercel.app/api/invoice?orderId=${ordId}`);
        });
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
