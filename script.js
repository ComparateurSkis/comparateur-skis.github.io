import { comparatorPathsMap } from "./comparator-paths.js";
import { products } from "./products.js";

const DELAY_DURATION = 500;
const FADE_IN_DURATION = 200;

const state = {
    products: products,
    productsDict: {},
    searchComponent: null,
    productListComponent: null,
    productListSearchInputComponent: null,
    noProductFoundComponent: null,
    comparatorModalComponent: null,
    productComponents: [],
    productSlotToUpdate: 0,
    selectedProductIdForComparatorModal: null,
}

function setState(stateKey, newState) {
    state[stateKey] = newState;
}

document.addEventListener("DOMContentLoaded", () => {
    initRouting();
    buildProductDict();
    initSearch();
    initProductListSearch();
    initComparatorModal();
});

function initRouting() {
    let locationHash = window.location.hash;
    if (locationHash) {
        locationHash = locationHash.replace('#', '');
        window.location.hash = '';
        window.location.pathname = locationHash;
    }
}

function getProductsGroupedByBrand(products) {
    return products.reduce((acc, product) => {
        if (!acc[product.brand]) {
            acc[product.brand] = [];
        }

        acc[product.brand].push(product);

        return acc;
    }, {});
}

function buildProductDict() {
    const productsDict = state.products.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
    }, {});

    setState('productsDict', productsDict);
}

function initSearch() {
    setState('searchComponent', document.querySelector("[data-id=searchComponent]"));
    const comparatorSwitchSelectors = document.querySelectorAll("[data-id=comparatorSwitchSelector]");

    if (state.searchComponent && comparatorSwitchSelectors.length === 2) {
        state.searchComponent.querySelector("[data-id=searchComponentSelectedProductToSwitchPreTitle]").innerText = 'Comparer les';
        state.searchComponent.querySelector("[data-id=searchComponentSelectedProductToSwitchPostTitle]").innerText = 'avec...';

        updateSearchResult(state.products);

        const searchInput = state.searchComponent.querySelector("[data-id=searchInput]");

        searchInput.addEventListener("input", () => {
            const searchValue = searchInput.value.toLowerCase();
            const filteredProducts = state.products.filter((product) => {
                const stringSearchable = `${product.title} ${product.brand}`;
                return stringSearchable.toLowerCase().includes(searchValue);
            });

            updateSearchResult(filteredProducts);
        });

        const searchComponentBackdrop = state.searchComponent.querySelector("[data-id=searchComponentBackdrop]");
        searchComponentBackdrop.addEventListener("click", closeSearchComponent);

        comparatorSwitchSelectors.forEach((comparatorSwitchSelector) => comparatorSwitchSelector.addEventListener("click", (event) => onComparatorSwitchSelectorClick(event, comparatorSwitchSelectors)));
    };
}

function updateSearchComponentSelectedProductTitleToSwitch(productId) {
    const selectedProductTitleToSwitch = state.searchComponent.querySelector("[data-id=searchComponentSelectedProductToSwitchTitle]");
    
    const selectedProductTitle = state.productsDict[productId].title
    selectedProductTitleToSwitch.innerText = selectedProductTitle;
}

function updateSearchResult(products) {
    const productsGroupedByBrand = getProductsGroupedByBrand(products);

    const productsFoundAmount = state.searchComponent.querySelector("[data-id=productsFoundAmount]");
    if (productsFoundAmount) {
        productsFoundAmount.innerText = products.length;
    }

    const productsListByBrand = state.searchComponent.querySelector("[data-id=productsListByBrand]");

    emptySearchResult(productsListByBrand);

    Object.entries(productsGroupedByBrand).forEach(([brandName, products]) => {
        const searchBrandList = document.createElement('li');
        searchBrandList.classList.add('mb-4');
        searchBrandList.innerHTML = getSearchListBrandTemplate(brandName);

        const productListContainer = searchBrandList.querySelector("[data-id=productListContainer]");

        for (const product of products) {
            const productItem = document.createElement('li');
            productItem.classList.add('flex', 'flex-row', 'justify-between', 'items-center', 'gap-2', 'mb-b');
            productItem.innerHTML = getSearchBrandListTemplate(
                product.id,
                product.images[0],
                product.title,
                product.practice,
                product.level
            );

            productItem.querySelector("[data-id=searchProductSwitchSelector]").addEventListener("click", selectProductToCompare);

            productListContainer.appendChild(productItem);
        }
        
        productsListByBrand.appendChild(searchBrandList);
    });
}

function getSearchListBrandTemplate(brandName) {
    return `
        <h4 class="uppercase text-sm font-bold text-gray-600 border-b border-b-gray-300 mb-2">
            ${brandName}
        </h4>
        <ul class="flex flex-col" data-id="productListContainer">
        </ul>
    `;
}

function getSearchBrandListTemplate(productId, imageUrl, title, practice, level) {
    return `
        <div class="w-full flex flex-row items-center gap-2 shrink truncate">
            <div class="rounded-full overflow-hidden w-12 h-auto flex items-center shrink-0">
                <img src="/images/${imageUrl}" alt="${title}">
            </div>
            <div class="w-full flex flex-col truncate">
                <span class="w-full text-lg font-black text-blue-900 uppercase truncate">
                    ${title}
                </span>
                <span class="w-full text-xs text-gray-600 -mt-1 truncate">
                    ${practice} / ${level}
                </span>
            </div>
        </div>
        <div 
            class="bg-white active:bg-blue-900 hover:bg-blue-900 focus:bg-blue-900 transition p-2 rounded-full text-blue-900 active:text-white hover:text-white flex flex-row items-center cursor-pointer gap-2"
            data-id="searchProductSwitchSelector"
            data-product-id="${productId}"
        >
            <svg data-id="searchProductSwitchSelectorIcon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-auto shrink-0 grow-0">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <svg data-id="searchProductSwitchSelectorLoader" aria-hidden="true" role="status" class="hidden w-5 h-auto text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#ffffff" fill-opacity="0.1"></path>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"></path>
            </svg>
        </div>
        
    `;
}

function emptySearchResult(productsListByBrand) {
    const searchProductSwitchSelectors = productsListByBrand.querySelectorAll("[data-id=searchProductSwitchSelector]");
    searchProductSwitchSelectors.forEach((element) => {
        element.removeEventListener("click", selectProductToCompare);
    });

    productsListByBrand.innerHTML = '';
}

function openSearchComponent() {
    const productSlotToUpdate = state.productSlotToUpdate;

    const comparatorSwitchSelectors = document.querySelector(`[data-id=comparatorSwitchSelector][data-slot='${productSlotToUpdate === 0 ? 1 : 0}']`);
    const productId = comparatorSwitchSelectors.getAttribute("data-product-id");

    updateSearchComponentSelectedProductTitleToSwitch(productId);

    state.searchComponent.setAttribute("data-animation-state", "opened");
    //lockWindoScroll();
}

function closeSearchComponent() {
    state.searchComponent.removeAttribute("data-animation-state");
    //unlockWindowScroll();
}

function lockWindoScroll() {
    document.body.style.overflow = "hidden";
}

function unlockWindowScroll() {
    document.body.style.overflow = "auto";
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
}

function onComparatorSwitchSelectorClick(event) {
    setState('productSlotToUpdate', parseFloat(event.currentTarget.getAttribute("data-slot")));
    openSearchComponent();
}

function selectProductToCompare(event) {
    const button = event.currentTarget;
    const buttonIcon = button.querySelector("[data-id=searchProductSwitchSelectorIcon]");
    const buttonLoader = button.querySelector("[data-id=searchProductSwitchSelectorLoader]");
    const productId = button.getAttribute("data-product-id");

    button.classList.add("bg-blue-900");
    button.classList.remove("bg-white");
    buttonIcon.classList.add("hidden");
    buttonLoader.classList.remove("hidden");
    buttonLoader.classList.add("inline");
    state.searchComponent.classList.add("pointer-events-none");
    
    updateProductDetailsInComparator(productId);

    setTimeout(() => {
        closeSearchComponent();
        button.classList.remove("bg-blue-900");
        button.classList.add("bg-white");
        buttonIcon.classList.remove("hidden");
        buttonLoader.classList.add("hidden");
        buttonLoader.classList.remove("inline");
        state.searchComponent.classList.remove("pointer-events-none");
    }, 2 * DELAY_DURATION);
}

function updateProductDetailsInComparator(productId) {
    const product = state.productsDict[productId];
    const elementsToUpdate = document.querySelectorAll(`[data-slot='${state.productSlotToUpdate}']`);
    elementsToUpdate.forEach((element) => {
        switch (element.getAttribute('data-id')) {
            case 'comparatorSwitchSelector':
                element.setAttribute('data-product-id', product.id);
                break;
            case 'comparatorBrandName':
                element.innerText = product.brand;
                break;
            case 'comparatorTitle':
                element.innerText = product.title;
                break;
            case 'comparatorImage':
                element.src = `/images/${product.images[0]}`;
                break;
            case 'comparatorAffliateLink':
                element.href = product.affiliate_link;
                break;
            case 'comparatorPrice':
                element.innerText = product.price;
                break;
            case 'comparatorYear':
                element.innerText = product.year;
                break;
            case 'comparatorPractice':
                element.innerText = product.practice;
                break;
            case 'comparatorLevel':
                element.innerText = product.level;
                break;
            case 'comparatorWeight':
                element.innerText = product.weight;
                break;
            case 'comparatorTip':
                element.innerText = product.tip;
                break;
            case 'comparatorWaist':
                element.innerText = product.waist;
                break;
            case 'comparatorTail':
                element.innerText = product.tail;
                break;
            case 'comparatorRadius':
                element.innerText = product.radius;
                break;
            case 'comparatorDetailsLink':
                element.href = `/${product.slug}`;
                break;
        }
        element.classList.add('fade-in');
        setTimeout(() => {
            element.classList.remove('fade-in');
        }, FADE_IN_DURATION);
    });
    const firstProductId = document.querySelector("[data-slot='0'][data-id=comparatorSwitchSelector]").getAttribute("data-product-id");
    const secondProductId = document.querySelector("[data-slot='1'][data-id=comparatorSwitchSelector]").getAttribute("data-product-id");
    updateUrl(firstProductId, secondProductId);
    updateComparatorPageTitle(firstProductId, secondProductId);
}


function updateComparatorPageTitle(firstProductId, secondProductId) {
    const firstTitleElement = document.querySelector("[data-id=comparatorPageTitle][data-slot='0']");
    const secondTitleElement = document.querySelector("[data-id=comparatorPageTitle][data-slot='1']");

    if (firstTitleElement && secondTitleElement) {
        const fistTitle = state.productsDict[firstProductId].title;
        const secondTitle = state.productsDict[secondProductId].title;
        firstTitleElement.innerText = fistTitle;
        secondTitleElement.innerText = secondTitle;
    }
}

function updateUrl(firstProductId, secondProductId) {
    const path = comparatorPathsMap[firstProductId][secondProductId];
    window.location.hash = path;
    //window.history.replaceState(null, null, path);
}


function initProductListSearch() {
    setState('productListSearchInputComponent', document.querySelector("[data-id=productListSearchInputComponent]"));
    setState('productListComponent', document.querySelector("[data-id=productListComponent]"));
    setState('productComponents', document.querySelectorAll("[data-selector=product]"));
    setState('noProductFoundComponent', document.querySelector("[data-id=noProductFoundComponent]"));

    if (state.productListSearchInputComponent) {
        state.noProductFoundComponent.innerHTML = '';
        state.productListSearchInputComponent.addEventListener("input", () => {
            const searchValue = state.productListSearchInputComponent.value.toLowerCase();
            const productsToHide = state.products.filter((product) => {
                const stringSearchable = `${product.title} ${product.brand}`;
                return !stringSearchable.toLowerCase().includes(searchValue);
            });

            updateProductListSearchResult(productsToHide);
        });
    };
}

function updateProductListSearchResult(productsToHide) {
    state.productListComponent.classList.add('fade-in');
    setTimeout(() => {
        state.productListComponent.classList.remove('fade-in');
    }, FADE_IN_DURATION);

    state.productComponents.forEach(element => {
        const productTitle = element.getAttribute("data-title");
        if (productsToHide.find(productToHide => productToHide.title === productTitle)) {
            element.classList.add("hidden");
        } else {
            element.classList.remove("hidden");
        }
    });

    state.noProductFoundComponent.innerHTML = '';

    if (productsToHide.length === state.productComponents.length) {
        state.noProductFoundComponent.classList.add('fade-in');
        setTimeout(() => {
            state.noProductFoundComponent.classList.remove('fade-in');
        }, FADE_IN_DURATION);
        state.noProductFoundComponent.innerHTML = getNoProductFoundTemplate();
    }
}

function getNoProductFoundTemplate() {
    return `
        <div class="overflow-hidden rounded-full mx-auto flex justify-center items-center w-52 w-52">
            <img src="/fail.gif" class="block w-full h-auto" alt="fail">
        </div>

        <h5 class="text-4xl font-black text-center uppercase text-blue-900 my-4">Aucune paire trouvée !</h5>
        <p class="text-gray-500">Désolé, pour le moment, cette paire n'est pas répertoriée.</p>
    `
}

function initComparatorModal() {
    setState('comparatorModalComponent', document.querySelector("[data-id=comparatorModalComponent]"));

    const productListSwitchSelectors = document.querySelectorAll("[data-id=productListSwitchSelector]");

    if (state.comparatorModalComponent && productListSwitchSelectors.length) {
        state.comparatorModalComponent.querySelector("[data-id=comparatorModalComponentSelectedProductToSwitchPreTitle]").innerText = 'Comparer les';
        state.comparatorModalComponent.querySelector("[data-id=comparatorModalComponentSelectedProductToSwitchPostTitle]").innerText = 'avec...';

        productListSwitchSelectors.forEach((productListSwitchSelector) => productListSwitchSelector.addEventListener("click", openComparatorModalComponent));

        const comparatorModalComponentCards = state.comparatorModalComponent.querySelectorAll("[data-id=comparatorModalComponentCard]");
        comparatorModalComponentCards.forEach((comparatorModalComponentCard) => comparatorModalComponentCard.addEventListener("click", onComparatorModalComponentCardClick));

        const comparatorModalComponentBackdrop = document.querySelector("[data-id=comparatorModalComponentBackdrop]");
        comparatorModalComponentBackdrop.addEventListener("click", closeComparatorModalComponent);
    }
}

function openComparatorModalComponent(event) {
    const productId = event.currentTarget.getAttribute("data-product-id");
    setState('selectedProductIdForComparatorModal', productId);
    updateComparatorModalComponentSelectedProductTitleToSwitch();
    updateComparatorModalComponentCards();

    state.comparatorModalComponent.setAttribute("data-animation-state", "opened");
    //lockWindoScroll();
}

function closeComparatorModalComponent() {
    state.comparatorModalComponent.removeAttribute("data-animation-state");
    //unlockWindowScroll();
}

function updateComparatorModalComponentSelectedProductTitleToSwitch() {
    const comparatorModalComponentSelectedProductToSwitchTitle = state.comparatorModalComponent.querySelector("[data-id=comparatorModalComponentSelectedProductToSwitchTitle]");
    
    const selectedProductTitle = state.productsDict[state.selectedProductIdForComparatorModal].title
    comparatorModalComponentSelectedProductToSwitchTitle.innerText = selectedProductTitle;
}

function updateComparatorModalComponentCards() {
    const firstProductId = document.querySelector("[data-slot='0'][data-id=comparatorSwitchSelector]").getAttribute("data-product-id"); 
    const secondProductId = document.querySelector("[data-slot='1'][data-id=comparatorSwitchSelector]").getAttribute("data-product-id");

    const firstProduct = state.productsDict[firstProductId];
    const secondProduct = state.productsDict[secondProductId];

    
    const firstModalCard = state.comparatorModalComponent.querySelector("[data-id=comparatorModalComponentCard][data-slot='0']");
    const secondModalCard = state.comparatorModalComponent.querySelector("[data-id=comparatorModalComponentCard][data-slot='1']");

    firstModalCard.setAttribute("data-product-id", firstProduct.id);
    secondModalCard.setAttribute("data-product-id", secondProduct.id);

    firstModalCard.querySelector("[data-id=comparatorModalComponentCardBrand]").innerText = firstProduct.brand;
    firstModalCard.querySelector("[data-id=comparatorModalComponentCardTitle]").innerText = firstProduct.title;
    firstModalCard.querySelector("[data-id=comparatorModalComponentCardImage]").src = `/images/${firstProduct.images[0]}`;

    secondModalCard.querySelector("[data-id=comparatorModalComponentCardBrand]").innerText = secondProduct.brand;
    secondModalCard.querySelector("[data-id=comparatorModalComponentCardTitle]").innerText = secondProduct.title;
    secondModalCard.querySelector("[data-id=comparatorModalComponentCardImage]").src = `/images/${secondProduct.images[0]}`;
}

function onComparatorModalComponentCardClick(event) {
    state.productSlotToUpdate = parseFloat(event.currentTarget.getAttribute("data-slot")) === 0 ? 1 : 0;
    updateProductDetailsInComparator(state.selectedProductIdForComparatorModal);
    scrollToTop();
    closeComparatorModalComponent();
}