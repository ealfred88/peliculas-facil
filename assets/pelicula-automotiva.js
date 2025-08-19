document.addEventListener("DOMContentLoaded", () => {
  const selectMarca = document.getElementById("select-marca");
  const selectModelo = document.getElementById("select-modelo");
  const produtoInfo = document.getElementById("produto-info");
  const buscarProduto = document.getElementById("buscar-produto");
  const buscarProdutoPlaca = document.getElementById(
    "buscar-produto-btn-placa"
  );
  const notFoundVehicle = document.querySelector('.not-found-vehicle');
  const carSelector = document.querySelector(".car-selector");
  const showProduct = document.getElementById("show-product");
  const selectType = document.getElementById("select-type");
  const selectTypePlaca = document.querySelector(".select-type__placa");
  const selectTypeModelo = document.querySelector(".select-type__modelo");
  const searchByModelToolTip = document.querySelector(".select-type__model--tooltip");
  let invalidPlaca = false;
  let placaVeiculo = "";
  let searchType;
  let screenWidth;
  
  function getScreenWidth() {
    screenWidth = window.innerWidth;
    console.log("Screen width:", screenWidth);
  }
  getScreenWidth();

  window.addEventListener('resize', function () {
    getScreenWidth();
  });


  selectType.addEventListener("click", () => {
    toggleSelectType();
  });

  function toggleSelectType(type) {
    if (screenWidth >= 992) resetOptions();
    if (selectType && selectTypePlaca && selectTypeModelo) {
      const isPlate = selectType.classList.contains("placa");
      if (isPlate) {
        selectType.textContent = "Encontrar pela placa do veículo";
        selectType.classList.remove("placa");
        selectTypeModelo.classList.add("active");
        selectTypePlaca.classList.remove("active");
        selectType.classList.add("modelo");
      } else {
        const inputPlaca = document.getElementById("placa-veiculo");
        selectType.textContent = "Encontrar por marca e modelo";
        selectType.classList.remove("modelo");
        selectTypePlaca.classList.add("active");
        selectTypeModelo.classList.remove("active");
        selectType.classList.add("placa");
        handleInputData();
        inputPlaca.value = "";
      }
    }
  }

  function handleInputData() {
    const inputPlaca = document.getElementById("placa-veiculo");
    inputPlaca?.addEventListener("input", () => {
      const placa = inputPlaca.value.trim().toUpperCase();
      const regex1 = /^[A-Z]{3}[0-9]{4}$/;
      const regex2 = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
      const cleanedPlaca = placa.replace(/[^A-Z0-9]/g, "");
      if (placa !== cleanedPlaca) {
        inputPlaca.value = cleanedPlaca;
      }
      if (placa.length >= 7) {
        inputPlaca.value = placa.slice(0, 7);
        if (!regex1.test(placa) && !regex2.test(placa)) {
          inputPlaca.setCustomValidity("Placa inválida");
          invalidPlaca = true;
          inputPlaca.style.borderColor = "red";
        }
      } else {
        inputPlaca.setCustomValidity("");
        invalidPlaca = false;
        inputPlaca.style.borderColor = "";
      }
      inputPlaca.reportValidity();
      placaVeiculo = placa;
    });
  }

  // SELECIONA MARCA
  selectMarca.addEventListener("change", async () => {
    const handle = selectMarca.value.toLowerCase();
    if (!handle) return;
    selectModelo.innerHTML = '<option value="">Carregando modelos...</option>';
    selectModelo.disabled = true;
    try {
      const products = await fetchProductsByCollection(handle);
      if (!products.length) {
        selectModelo.innerHTML =
          '<option value="">Nenhum modelo encontrado</option>';
        return;
      }
      selectModelo.innerHTML = '<option value="">Selecione um modelo</option>';
      products.forEach((product) => {
        selectModelo.innerHTML += `<option value="${product.handle}">${product.metafield_modelo.value}</option>`;
      });
      selectModelo.disabled = false;
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      selectModelo.innerHTML =
        '<option value="">Erro ao carregar modelos</option>';
    }
  });

  async function fetchProductsByCollection(collectionHandle) {
    const storefrontAccessToken = "ad4a9be2a38ab8b8fb23c4274d2d5e7b";
    const shop = "peliculas-facil.myshopify.com";

    const query = `
    {
      collection(handle: "${collectionHandle}") {
        products(first: 50) {
          edges {
            node {
              id
              handle
              title
              description
              vendor
              productType
              tags
              availableForSale
              metafield_modelo: metafield(namespace: "custom", key: "modelo_do_veiculo") {
                value
              }
              featuredImage {
                id
                url
                altText
                width
                height
              }
              variants(first: 5) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

    try {
      const response = await fetch(`https://${shop}/api/2023-07/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.errors) {
        console.error("Erros GraphQL:", data.errors);
        return [];
      }

      if (!data.data.collection) {
        console.error("Collection não encontrada:", collectionHandle);
        return [];
      }

      const products = data.data.collection.products.edges.map((edge) => {
        const product = edge.node;
        return {
          ...product,
          modelo_veiculo: product.metafield_modelo?.value || null,
          ano: product.metafield_ano?.value || null,
          marca: product.metafield_marca?.value || null,
        };
      });
      return products;
    } catch (error) {
      console.error("Erro ao buscar produtos da collection:", error);
      return [];
    }
  }
  // BUSCA MODELO
  buscarProduto.addEventListener("click", async () => {
    searchType = "modelo";
    validate();
  });

  // BUSCA PLACA
  buscarProdutoPlaca.addEventListener("click", async () => {
    searchType = "placa";
    validatePlate();
  });

  function validatePlate() {
    const inputPlaca = document.getElementById("placa-veiculo");
    if (invalidPlaca) {
      inputPlaca.setCustomValidity("Placa inválida. Por favor, verifique.");
      inputPlaca.reportValidity();
      return;
    }
    if (!placaVeiculo) {
      inputPlaca.setCustomValidity("Por favor, digite a placa do veículo.");
      inputPlaca.reportValidity();
      return;
    }
    if (placaVeiculo.length < 7) {
      inputPlaca.setCustomValidity("Complete a placa do veículo.");
      inputPlaca.reportValidity();
      return;
    }
    const loading = document.querySelector(".car-selector .loading");
    if (loading) loading.classList.add("active");

    loadProductPlate();
  }

  function validate() {
    const handleModelo = selectModelo.value;
    const handleMarca = selectMarca.value;
    if (!handleMarca) {
      selectMarca.setCustomValidity("Por favor, selecione uma marca.");
      selectMarca.reportValidity();
      return;
    }
    if (!handleModelo) {
      selectModelo.setCustomValidity("Por favor, selecione um modelo.");
      selectModelo.reportValidity();
      return;
    }
    const loading = document.querySelector(".car-selector .loading");
    if (loading) loading.classList.add("active");
    loadProduct("modelo", selectModelo.value);
  }
  async function loadProductPlate() {
    try {
      const response = await fetch(
        `https://wdapi2.com.br/consulta/${placaVeiculo}/23a63710eb32a7c88abed69309202ffb`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      loadProduct("placa", data);
      return data;
    } catch (error) {
      throw error;
    }
  }

  function loadProduct(type, data) {
    if (!data || !type) return;
    const subSegmento = () => {
      const isHatch = data?.extra?.sub_segmento
        ?.toLowerCase()
        .includes("hatch");
      const isSedan = data?.extra?.sub_segmento
        ?.toLowerCase()
        .includes("sedan");
      return isHatch ? "AND title:HATCH" : isSedan ? "AND title:SEDAN" : "";
    };
    let requestType;
    if (type === "modelo") {
      requestType = `handle: "${data}"`;
    } else if (type === "placa") {
      requestType = `query: "(title:${data.MARCA} AND title:${
        data.SUBMODELO
      } ${subSegmento()}) OR (title:${data.SUBMODELO} ${subSegmento()})"`;
    }
    if (showProduct.classList.contains("active")) {
      showProduct.classList.remove("active");
    }
    fetchProduct(requestType);
  }

  async function fetchProduct(requestType) {
    const storefrontAccessToken = "ad4a9be2a38ab8b8fb23c4274d2d5e7b";
    const shop = "peliculas-facil.myshopify.com";

    // Detectar se é busca por query ou handle
    const isQuery = requestType.includes("query:");

    let query;

    if (isQuery) {
      // Para busca por query, usar products (plural)
      query = `
      {
        products(first: 5, ${requestType}) {
          edges {
            node {
              id
              handle
              title
              description
              descriptionHtml
              vendor
              productType
              tags
              availableForSale
              totalInventory
              createdAt
              updatedAt
              metafield(namespace: "custom", key: "modelo_do_veiculo") {
                value
              }
              publishedAt
              onlineStoreUrl
              featuredImage {
                id
                url
                altText
                width
                height
              }
              images(first: 10) {
                edges {
                  node {
                    id
                    url
                    altText
                    width
                    height
                  }
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    availableForSale
                    currentlyNotInStock
                    quantityAvailable
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    weight
                    weightUnit
                    requiresShipping
                    taxable
                    sku
                    barcode
                    selectedOptions {
                      name
                      value
                    }
                    image {
                      id
                      url
                      altText
                    }
                  }
                }
              }
              options {
                id
                name
                values
              }
              collections(first: 5) {
                edges {
                  node {
                    id
                    title
                    handle
                  }
                }
              }
              seo {
                title
                description
              }
            }
          }
        }
      }
    `;
    } else {
      // Para busca por handle, usar product (singular)
      query = `
      {
        product(${requestType}) {
          id
          handle
          title
          description
          descriptionHtml
          vendor
          productType
          tags
          availableForSale
          totalInventory
          createdAt
          updatedAt
          metafield: metafield(namespace: "custom", key: "modelo_do_veiculo") {
            value
          }
          publishedAt
          onlineStoreUrl
          featuredImage {
            id
            url
            altText
            width
            height
          }
          images(first: 10) {
            edges {
              node {
                id
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                availableForSale
                currentlyNotInStock
                quantityAvailable
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                weight
                weightUnit
                requiresShipping
                taxable
                sku
                barcode
                selectedOptions {
                  name
                  value
                }
                image {
                  id
                  url
                  altText
                }
              }
            }
          }
          options {
            id
            name
            values
          }
          collections(first: 5) {
            edges {
              node {
                id
                title
                handle
              }
            }
          }
          seo {
            title
            description
          }
        }
      }
    `;
    }

    try {
      const response = await fetch(`https://${shop}/api/2023-07/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": storefrontAccessToken,
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (data.errors) {
        console.error("Erros GraphQL:", data.errors);
        return;
      }

      let product;

      if (isQuery) {
        const products = data.data.products.edges;
        if (products.length > 0) {
          product = products[0].node;
        } else {
          const loading = document.querySelector(".car-selector .loading");
          if (loading) loading.classList.remove("active");
          if (notFoundVehicle) {
            notFoundVehicle.classList.add("active")
            if (screenWidth < 992) notFoundVehicle.scrollIntoView({ behavior: "smooth", block: "center" });
          };
          handleNotMyVehicleClick('.not-found-vehicle');
          console.error("Nenhum produto encontrado para a busca");
          return;
        }
      } else {
        product = data.data.product;
        if (!product) {
          console.error("Produto não encontrado pelo handle");
          return;
        }
      }
      loadQuickBuySnippet(product.handle);
    } catch (error) {
      console.error("Erro ao buscar dados do produto:", error);
    }
  }

  async function loadQuickBuySnippet(productHandle) {
    try {
      const response = await fetch(
        `/products/${productHandle}?sections=home-pelicula-automotiva-produto`
      );
      const data = await response.json();
      if (data["home-pelicula-automotiva-produto"]) {
        document.getElementById("show-product").innerHTML =
          data["home-pelicula-automotiva-produto"];
        if (showProduct) {
          document.getElementById("show-product").classList.add("active");
          if (carSelector) {
            setTimeout(() => {
              if (screenWidth >= 992) carSelector.scrollIntoView({ behavior: "smooth", block: "center" });
              if (showProduct && screenWidth < 992) showProduct.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 500);
          }
        }
        const notMyVehicleButton = document.querySelector(".not-my-vehicle");
        if (notMyVehicleButton) {
          notMyVehicleButton.classList.remove("active");
          if (searchType === "placa") {
            notMyVehicleButton.classList.add("active");
            handleNotMyVehicleClick('.not-my-vehicle');
          }
        }
      }
      const loading = document.querySelector(".car-selector .loading");
      if (loading) loading.classList.remove("active");
    } catch (error) {
      console.error("Erro ao carregar quick-buy:", error);
    }
  }

  function handleNotMyVehicleClick(className) {
    const notMyVehicleButton = document.querySelector(className);
    if (notMyVehicleButton) {
      notMyVehicleButton.addEventListener("click", () => {
        if (selectType && selectTypePlaca && selectTypeModelo) {
          const isPlate = selectType.classList.contains("placa");
          if (isPlate) {
            setTimeout(() => {
              selectType.textContent = "Encontrar pela placa do veículo";
              selectType.classList.remove("placa");
              selectTypeModelo.classList.add("active");
              selectTypePlaca.classList.remove("active");
              selectType.classList.add("modelo");
              setTimeout(() => {
                searchByModelToolTip.classList.add("active");
                setTimeout(() => {
                  searchByModelToolTip.classList.remove("active");
                }, 3000);
              }, 300);
            }, 500);
            const triggerClass = document.querySelector(className);
            if (triggerClass && triggerClass.classList.contains("active")) triggerClass.classList.remove("active");
          }
        }
                resetOptions();
      });
    }
  }

  function resetOptions() {
    showProduct.classList.remove("active");
    if (carSelector && screenWidth >= 992) {
      setTimeout(() => {
        carSelector.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 500);
    }
    if (carSelector && screenWidth < 992) {
      carSelector.scrollIntoView({ behavior: "smooth", block: "center", offsetTop: 200 });
    }
  }
});
