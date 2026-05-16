export default class display {
    
    static getTotalBudget (){
        const totalBudget = localStorage.getItem("totalBudget") || "0";
        return totalBudget;
    }

    static setTotalBudget (num){
        localStorage.setItem("totalBudget", num);
    }

    static getAllTrans (){
        const data = localStorage.getItem("trans-data") || "[]";
        const transData = JSON.parse(data);
        return transData;
    }

    static getDisplayCurrency() {
     return localStorage.getItem("display-currency") || "INR";
    }

    static setDisplayCurrency(currency) {
     localStorage.setItem("display-currency", currency);
    }

    static saveTrans (trans = {}){
        const allTrans = display.getAllTrans();
        const exiting = allTrans.find(item => item.id == trans.id);
        if (exiting){
            exiting.amount = trans?.amount;
            exiting.tag = trans?.tag;
            exiting.originalAmount = trans?.originalAmount;
            exiting.currency = trans?.currency;
        }
        else{
            allTrans.unshift(trans);
        }

        localStorage.setItem("trans-data", JSON.stringify(allTrans));
    }

    static deleteTrans (id){
        const allTrans = display.getAllTrans();
        const tranId = Number(id);
        const filteredTrans = allTrans.filter(item => item.id != tranId);
        localStorage.setItem("trans-data", JSON.stringify(filteredTrans));
        
    }
    static findTran(id){
        const allTrans = display.getAllTrans();
        const tranId = Number(id);
        const tran = allTrans.find(item => item.id == tranId);
        return tran;
    }

    static getBudgetMeta() {
        return JSON.parse(localStorage.getItem("budget-meta") || '{"currency":"INR","originalAmount":0}');
    }

    static setBudgetMeta(currency, originalAmount) {
        localStorage.setItem("budget-meta", JSON.stringify({ currency, originalAmount }));
    }

    static getAllTags (){
        const allTags  = localStorage.getItem("tags") || "[]";
        return JSON.parse(allTags);
    }

    static saveTag (str){
        const allTags = display.getAllTags();
        const exiting = allTags.find(tag => tag == str);
        if (exiting){
            return `Tag already exit`;
        }
        else{
            allTags.push(str);
        }
        localStorage.setItem("tags", JSON.stringify(allTags));
    }
    
}