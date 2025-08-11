export const formFieldsReducer = (originData, action) => {
    let result = [...originData]
    switch (action.type) {
        case 'itemReplace': {
            result = result.map((item,index) => {
                if(action.itemSearch(item,index)){
                    item = action.factory(item)
                }
                return item
            })
            break;
        }
        case 'update': {
            result = action.data(result)
            break;
        }
    }
    console.log(result.find(i => i.name === 'translation').required.toString())
    return result
}