const version = 1;
var db = indexedDB.open("db",version);
var itemId = document.form.invoiceID.value;
var query = "SELECT * FROM invoices WHERE id = ?";

const transaction = db.transaction("ItemId",'readonly')
const store = transaction.objectStore('invoices');
  
try {
    const item = await store.get(itemId);
}
catch(err){
    console.error(err)
    throw err;
}