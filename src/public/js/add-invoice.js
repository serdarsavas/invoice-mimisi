const html = `
  <div class="form-control"><label>Beskrivning</label><input type="text" name="description[]" required/></div>
  <div class="form-control"><label>Antal</label><input type="number" name="quantity[]" step=".01" required/></div>
  <div class="form-control"><label>Pris</label><input type="number" name="price[]" step=".01" required/></div>
  `;
const rows = document.getElementById("rows");

document.getElementById("add-row").addEventListener("click", () => {
  const row = document.createElement("div");
  row.classList.add("row");
  row.innerHTML = html;
  rows.appendChild(row);
});

document.getElementById("delete-row").addEventListener("click", () => {
  const rowElems = rows.querySelectorAll(".row");
  if (rowElems.length > 1) {
    rows.removeChild(rowElems[rowElems.length - 1]);
  }
});

document.getElementById("copy-row").addEventListener("click", () => {
  const newRow = rows.lastElementChild.cloneNode(true);
  rows.appendChild(newRow);
});

//Fetch recipients

const button = document.getElementById("get-recipients");

if (button) {
  button.addEventListener("click", async e => {
    e.preventDefault();

    try {
      const data = await fetch("/admin/get-recipient");
      const jsonData = await data.json();
      const targetRecipient = document.querySelector("#target-recipient").value;
      const recipient = jsonData.find(
        item => item.authority === targetRecipient
      );
      document.querySelector("#name").value = recipient.name;
      document.querySelector("#city").value = recipient.city;
      document.querySelector("#street").value = recipient.street;
    } catch (e) {
      console.log(e);
    }
  });
}
