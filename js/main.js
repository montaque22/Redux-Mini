$(document).ready(()=>{

    Store.registerReducer('todo', 'ADD',(state = [], actions) => {
        return [...state, actions.todo];
    });

    Store.registerReducer('todo', 'DELETE',(state = [], actions) => {
        return [...state].filter((action, index) =>{
            return index != actions.index;
        });
    });

    Store.onComplete('ADD', (store, action, next) => {

        drawCard(store);
        updateObjectMap(store);
        todos.children().last().velocity('transition.slideRightIn',{
            complete:() => {
                next();
            }
        })

    });

    Store.onComplete('DELETE', (store, action, next) =>{

        const $card =  $($('.card').get(action.index));
        updateObjectMap(store);
        $card.velocity('transition.slideRightOut',{
            complete:()=>{
                drawCard(store);
                next();
            }
        })
    });


    const source    = $("#todo-items").html();
    const template  = Handlebars.compile(source);
    const itemInput = $('#item');
    const todos     = $('#todos');
    const store     = new Store(null, {enableCaching: true, shouldLoadFromCache: true, subscribers: [
        function(store){
            // $('.object-map').html(JSON.stringify(store, null, 4));
        }
    ]});


    itemInput.keypress((e) => {
        if(e.keyCode == 13)
            addItem()
    })

    $('#add-item').click(addItem);

    function drawCard(store){
        $('.remove-btn').off('click', removeItem);
        const html  = template(store);
        todos.html($(html));
        $('.remove-btn').click(removeItem)
    }

    function addItem(e){

        const item  = itemInput.val();
        itemInput.val('');
        store.dispatch({type:'ADD', todo: {item}});
    }

    function removeItem(e){
        const index = $(e.currentTarget).data('index');
        store.dispatch({type:'DELETE', index});
    }

    function updateObjectMap(store){
        $('.object-map').html(JSON.stringify(store, null, 4));
    }
});

