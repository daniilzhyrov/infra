const NumberOfRecordsOnAPage = 3;
let page = 1;
let query = "";

loadItems();

function setLoadingScreen() {
    const label = document.createElement('div');
    label.style.width = '100%';
    label.style.marginTop = '38vh';
    label.style.marginBottom = '27vh';
    label.style.textAlign = 'center';
    label.style["font-size"] = '2.2vmin';
    label.innerHTML = 'Loading...';
    const container = document.getElementById('itemContainer');
    container.innerHTML = '';
    container.appendChild(label);
}

function nextPage() {
    page++;
    loadItems();
}

function prevPage() {
    if (page > 1) {
        page--;
        loadItems();
    }
}

function loadPage(newValue) {
    page = Number(newValue);
    loadItems();
}

function filterItems(newValue) {
    page = 1;
    query = newValue;
    loadItems();
}

async function loadItems () {
    setLoadingScreen();
    const container = document.getElementById('itemContainer');
    try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            document.location = '/auth/login?info=mustLogin&redirect=' + document.location;
            return;
        }
        const reqOptions = {
            headers: { Authorization: `Bearer ${jwt}`, },
        };

        if (!page || isNaN(page))
            page = 1;
        if (query && query.length > 32)
            query = query.substr(0, 32);
        const res = await Promise.all ([fetch('/api/v1/itemsToOrder?page='.concat (page).concat ("&numberOfRecordsOnAPage=").concat(NumberOfRecordsOnAPage).concat ((query && query.length > 0) ? "&query=".concat(query) : ""), reqOptions),
                                        fetch('/templates/item_container.mst').then(x => x.text())])
        
        
        if (res[0].status == 401) {
            document.location = '/auth/login?info=mustLogin&redirect=' + document.location;
            return;
        }
        res[0] = await res[0].json();
        
        const items = res[0].itemsToOrder;
        const amountOfRecords = res[0].amountOfRecords;
        const containerTemplate = res[1];
        
        let pages = [];
        for (let i = 1; i <= Math.floor((amountOfRecords + NumberOfRecordsOnAPage - 1)/NumberOfRecordsOnAPage); i++)
            pages.push({
                page : i,
                current : page == i
            });
        container.innerHTML = Mustache.render(containerTemplate, {
                items : items,
                pages : pages,
                prevPage : page > 1,
                nextPage : page + 1 <= pages.length,
                showPageSelector : pages.length > 1,
                query : query,
        });
        const searchField = document.getElementById('item_search_field');
        searchField.addEventListener('keydown', function onEvent(event) {
            if (event.key === "Enter")
                filterItems(searchField.value);
        });
        if (!items && page > 1)
            page--;
    } catch(err) {
        console.log(err)
        const errorDiv = document.createElement('div');
        const label = document.createElement('p');
        label.innerHTML = 'Problem occured while loading content';
        label.style.marginTop = '36vh';
        errorDiv.style.textAlign = 'center';
        errorDiv.appendChild(label);
        container.innerHTML='';
        container.appendChild(errorDiv);
    }
}