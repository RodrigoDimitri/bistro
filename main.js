var mysession;
// var order;
var establishment = {};
var profileData = [];
var preParams;


// $(document).on('ready', function () {
//     // $('.sidenav').sidenav();
// });

$(document).ready(function () {

    // window.onpopstate = function (e) {
    //     e.preventDefault();
    //     console.log('Voltar?');
    // };

    // $('.total').text(parseFloat(total).toFixed(2));

    chrome.bluetooth.getAdapterState(function(adapter) {
        console.log("Adapter " + adapter.address + ": " + adapter.name);
      });

    $(".form-login").submit(function (e) {
        e.preventDefault();

        var method = $(this).attr('method'),
            url = $(this).attr('action'),
            params = $(this).serializeArray();

        $.when(AjaxSection(url, params, method)).then(function (res) {
            if (res.result) {
                profileData = res.data;
                $('a span.name').text(profileData.name);
                $('a span.email').text(profileData.email);
                $('sidernav').html($('side-model').html());
                $('.sidenav').sidenav();
                $('main').html($('falta').html());
            } else {
                alert('Login Invalido');
            }
        }, function (erro) {
            // console.log(erro);
        });

    });

    // Centraliza horizontal vertical!
    $('.a-middle').css('margin-top', function () {
        return ($(window).height() - $(this).height()) / 6;
    });


    $(document).on('click', '.get-stablish', function (e) {

        $('main').html('');
        $('main').append('<ul class="collection list-stablish"></ul>');

        var stablish = profileData.establishments;

        for (var row in stablish) {
            var model =
                '<li class="collection-item avatar hover list-orders" data-url="/orders" data-method="get" data-id="' + stablish[row].id + '">'
                + '<i class="material-icons circle" style="background:blueviolet">' + stablish[row].type.icon + '</i>'
                + '<b class="text-secondary">' + stablish[row].business_name + '</b>'
                + '<p class="text-secondary">' + stablish[row].cnpj + '</p>'
                + '</li>';

            $('ul.list-stablish').append(model);
        }
    });

    $(document).on('click', '.list-orders', function (e) {
        e.preventDefault();
        var url = "/orders";
        var method = 'get';
        var params = {
            establishment: ($(this).data("id") != null ? $(this).data("id") : establishment.id),
        }

        for (var row in profileData.establishments) {
            if (profileData.establishments[row].id == params.establishment) {
                $('#estabelecimento').text(profileData.establishments[row].business_name);
                console.log('Select Establishment -> ', profileData.establishments[row].business_name);
            }
        }

        $.when(AjaxSection(url, params, method)).then(function (res) {
            establishment.id = params.establishment;
            establishment.order = res.data;

            console.log('.list-orders establishment.order -> ', establishment.order);


            var floatButton = '<div class="fixed-action-btn"><a class="btn-floating btn-large red put-order"><i class="large material-icons">mode_edit</i></a></div>';
            $('main').html(floatButton);

            $('main').append('<div class="container flex-container"></div>');

            for (var row in establishment.order) {

                var model = '<div class="mycard waves-effect get-order '
                    + (establishment.order[row].table != null ? '"' : 'bg-warning"')
                    + ' data-url="/#" data-method="get" data-order="'
                    + establishment.order[row].id
                    + '"><i class="material-icons">fastfood</i> <b>#'
                    + (establishment.order[row].table != null ? establishment.order[row].table : 'avulso')
                    + '</b><br>'
                    + (establishment.order[row].reference != null ? '<b>'
                        + establishment.order[row].reference + '</b><br>' : '')
                    + '<span class="m"> $ '
                    + (parseFloat(establishment.order[row].total) / 100).toFixed(2)
                    + '</span></div>';

                $('div.flex-container').append(model);
            }

            // $('.money').mask("#.##0,00", { reverse: true });

        }, function (erro) {
            // console.log(erro);
        });
    });

    $(document).on('click', '.put-order', function (e) {
        e.preventDefault();

        var params = {
            establishment: establishment.id,
            table: null,
            reference: null,
        }

        $('main').html('');

        $('main').append('<ul class="collection">'
            + '<li class="collection-item avatar">'
            + '  <i class="material-icons circle" style="background:red">attach_money</i>'
            + '  <b class="text-primary"> Minha Empresa <span class="total">'
            + '  <input placeholder="Mesa Comanda" id="table" type="number" name="table">'
            + '  <input placeholder="Referencia" id="reference" type="text" name="reference">'
            + '  <button class="btn waves-effect waves-light new-order" style="width: 100%" type="submit">Confirmar</button>'
            + '  </span></b>'
            + '</li>'
            + '</ul>');

    });

    $(document).on('click', '.new-order', function (e) {
        e.preventDefault();

        var params = {
            establishment: establishment.id,
            table: $('#table').val(),
            reference: $('#reference').val(),
        }

        var temp = [];
        for (var index in establishment.order) {
            var it = establishment.order[index].table;
            if (typeof (it) == 'number') {
                temp.push(it);
            }
        }

        if (params.table == "") {
            var table = 1;
            while ($.inArray(table, temp) != -1) {
                // found it
                table = table + 1;
            }
            params.table = table;

        } else if ($.inArray(parseInt(params.table), temp) != -1) {
            // found it
            console.log('Esta comanda não está disponivel');
            return;
        }

        console.log(params);
        M.toast({ html: '<span>Confirmar Operação?</span><button class="btn-flat toast-action" onclick="function()">Confirm</button>', classes: 'rounded' });

        $.when(AjaxSection('/orders', params, 'post')).then(function (res) {
            console.log('post Orders -> ', res);
            if (res.response) {
                GetOrder(res.id);
            } else {
                M.toast({ html: 'Operação falhou!', classes: 'rounded' });
            }

        });

    });

    $(document).on('click', '.get-product', function (e) {
        e.preventDefault();
        // console.log('.get-product -> ', establishment);
        // console.log('establishment.sel_order -> ', establishment.sel_order);

        var params = {
            establishment: establishment.id,
            search: ' ',
            highlighted: true,
            take: 100,
        }

        $.when(AjaxSection('/products', params, 'get')).then(function (res) {
            if (res.response) {
                // console.log(' res -> ', res.data);
                var produtos = res.data;

                $('main').html('<div class="search-product">'
                    + '<ul class="collection">'

                    + '<li class="collection-item avatar">'
                    + '  <i class="material-icons circle waves-effect" onclick="GetOrder(' + establishment.sel_order.id + ')" style="background:blueviolet">arrow_back_ios</i>'
                    + '  <input placeholder="Buscar Produto" id="searchProduct" type="text" name="search">'
                    + '  '
                    + '</li>'

                    + '</div>'
                    + '<div class="flex-container produtos"></div>');

                for (var row in produtos) {
                    $('div.produtos').append('<div class="mycard waves-effect text-white edit-product" '
                        + 'data-prod="' + produtos[row].id + '" '
                        + 'data-name="' + produtos[row].name + '" '
                        + 'data-price="' + produtos[row].price + '">'
                        + produtos[row].name + '<br>'
                        + '$ ' + (parseFloat(produtos[row].price) / 100).toFixed(2) + '<br>'
                        + (produtos[row].ean13_code != null ? 'EAN Code ' + produtos[row].ean13_code : '')
                        + '</div>')
                }

            }
        });
    });

    $(document).on('click', '.edit-product', function (e) {
        e.preventDefault();
        var item = {
            id: $(this).data('prod'),
            name: $(this).data('name'),
            price: $(this).data('price'),
        }
        console.log('item -> ', item);
        console.log('establishment.sel_order -> ', establishment.sel_order);
        $('div.produtos').hide(250);
        // $('main').append('<div class="quantity">prod</div>');

        $('main').append('<div id="quantity"><ul class="collection">'
            + '<li class="collection-item avatar">'
            + '  <i class="material-icons circle waves-effect back-product" style="background:blueviolet">skip_previous</i>'
            + '  <b class="text-secondary">' + item.name + '</b>'
            + '   <div class="mycard text-secondary" style="border-color:blueviolet">'
            + '    Unit R$ <span class="price">' + (parseFloat(item.price) / 100).toFixed(2) + '<span> x '
            + '      <input class="quantity" type="number" name="quantity" value="1000" onkeyup="SumFunction()">'
            + '      <div class="mycard text-red"><b>Total R$ <span class="total">' + (parseFloat(item.price) / 100).toFixed(2) + '</span></b></div>'
            + '     <div class="row">'
            // + '     <div class="col s6">'
            + '      <div data-order="' + establishment.sel_order.id + '" data-product="' + item.id + '" class="mycard waves-effect bg-secondary text-white save-order" style="width: 100%">Confirmar</div>'
            // + '     </div><div class="col s6">'
            // + '      <div class="mycard waves-effect bg-secondary text-white back-product" style="width: 100%">Cancelar</div>'
            // + '     </div>'
            // + '     </div>'
            + '   </div>'
            + '</li>'
            + '</ul>'
            // + '<div class="mycard waves-effect bg-secondary text-white back-product" style="width: 100%">Cancelar</div>'
            + '</div>');


        $('.quantity').mask("###0.000", { reverse: true });
        $("input.quantity").select();

    });

    $(document).on('click', '.save-order', function (e) {
        e.preventDefault();
        var orderId = $(this).data("order");
        var params = {
            items: [
                {
                    id: $(this).data('product'),
                    quantity: parseInt(parseFloat($('input.quantity').val()) * 1000)
                }
            ]
        }

        console.log('order #', orderId);
        console.log('params', params);
        preParams = params;

        M.toast({ html: '<span>Confirmar Operação?</span><button class="btn-flat toast-action" onclick="SaveOrder(' + orderId + ');M.Toast.dismissAll();">Confirm</button>', classes: 'rounded' });

        // SaveOrder();
    });

    $(document).on('click', '.back-product', function (e) {
        e.preventDefault();
        $('div#quantity').remove();
        $('div.produtos').show(250);
    });

    $(document).on('click', '.get-order', function (e) {
        e.preventDefault();
        var orderId = $(this).data("order");
        GetOrder(orderId);
    });


});

function SaveOrder(orderId) {

    $.when(AjaxSection('/sales/order/' + orderId, preParams, 'post')).then(function (res) {
        console.log('SaveOrder -> ', res);
        GetOrder(orderId);
        M.toast({ html: '<span onclick="M.Toast.dismissAll();">' + res.message + '</span>', classes: 'rounded' });
    }, function (err) {
        M.toast({ html: '<span>Erro interno. Solicite suporte técnico</span>', classes: 'rounded' });
    });
}

function GetOrder(OrderId) {
    var url = "/orders";
    var method = 'get';
    var params = {
        establishment: establishment.id,
    }

    for (var row in profileData.establishments) {
        if (profileData.establishments[row].id == params.establishment) {
            $('#estabelecimento').text(profileData.establishments[row].business_name);
        }
    }

    $.when(AjaxSection(url, params, method)).then(function (res) {
        establishment.id = params.establishment;
        establishment.order = res.data;

        for (var row in establishment.order) {
            if (establishment.order[row].id == OrderId) {
                establishment.sel_order = establishment.order[row];
                var sales = establishment.sel_order.items;
                var total = 0;
                var floatButton = '<div class="fixed-action-btn"><a class="btn-floating btn-large red get-product"><i class="large material-icons">exposure_plus_1</i></a></div>';
                $('main').html(floatButton);

                $('main').append('<ul class="collection total-order">'
                    + '<li class="collection-item avatar text-primary">'
                    + '  <i class="material-icons circle waves-effect list-orders" style="background:blueviolet">arrow_back_ios</i>'
                    + (establishment.sel_order.reference != null ? '<b>' + establishment.sel_order.reference + '</b><br>' : '')
                    + (establishment.sel_order.table != null ? '<b>#' + establishment.sel_order.table + '</b><br>' : '')
                    + '  <b class="text-red"> Total R$ <span class="total">'
                    + '</span></b>'
                    // + '<span class="secondary-content"><i class="material-icons text-white">arrow_back_ios</i></span>'
                    + '</li>'
                    + '</ul>');

                $('main').append('<ul class="collection list-products"></ul>');

                for (var sale in sales) {
                    var products = sales[sale].sale.items;
                    for (var prod in products) {
                        var item = ''
                            + '<li class="collection-item avatar">'
                            + '  <i class="material-icons circle" style="background:blueviolet">shopping_cart</i>'
                            + '  <b class="text-secondary"> ' + products[prod].product.name + '</b>'
                            + '  <p class="text-secondary"><span>'
                            + (parseFloat(products[prod].quantity) / 1000).toFixed(3) + '</span> x R$ <span>'
                            + (parseFloat(products[prod].product.price) / 100).toFixed(2) + '</span> = R$ <span">'
                            + ((parseFloat(products[prod].product.price) / 100) * (parseFloat(products[prod].quantity) / 1000)).toFixed(2) + '</span></p>'
                            + '<a href="#!" class="secondary-content"><i class="material-icons text-red">delete_forever</i></a>'
                            + '</li>';
                        $('ul.list-products').append(item);
                        total = total + ((parseFloat(products[prod].product.price) / 100) * (parseFloat(products[prod].quantity) / 1000));
                    }
                }
                $('.total').text(parseFloat(total).toFixed(2));
            }
        }
    });
}


// $(document).ajaxStart(function () {
//   $('html, body').css("cursor", "progress");
// });

// $(document).ajaxComplete(function () {
//   $('html, body').css("cursor", "default");
// });

function AjaxSection(url, params, method) {
    var dfd = new $.Deferred();

    if (!url.startsWith("/")) {
        url = "/" + url;
    }

    $.ajax({
        type: method,
        url: "https://zpark.jjr.eti.br/api/v1" + url,
        async: true,
        data: params,
        dataType: 'json',
        responseType: 'application/json',
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Access-Control-Allow-Origin", '*');
            ((typeof (profileData.api_token) != 'undefined') ?
                xhr.setRequestHeader("Authorization", 'Bearer ' + profileData.api_token) : '');
        },
        success: function (result) {
            dfd.resolve(result);
        },
        error: function (xhr) { // if error occured
            console.log('\nAjaxSection > XHR : ', xhr);
            dfd.reject(xhr);
        },
        complete: function () {
        }
    }, function (erro) {
        console.log('\nAjaxSection > ERRO : ', erro);
        dfd.reject(erro);
    });

    return dfd.promise();
}

function SumFunction() {
    var price = parseFloat($('span.price').text());
    var quantity = parseFloat($('input.quantity').val());
    var total = price * quantity;
    $('span.total').text(total.toFixed(2));

    // console.log('price -> ', price);
    // console.log('quantity -> ', quantity);
    // console.log('total -> ', total);
}

function myFilter() {
    console.log('keyup');
    /* implementar um filtro */
}