const http = require('http');
const request = require('request-promise');
const cheerio = require('cheerio');

const httpAgent = new http.Agent()
httpAgent.maxSockets = 15

/**
 * Fetches deputy information available at http://www2.camara.leg.br/deputados/pesquisa
 * and POSTS it to http://localhost:3000/api/data endpoint.
 * @param String url - url to being scraping
 */
const loadDeputies = async (url) => {    
    try {
        const body = await request.get({url, headers:{'User-Agent':'Mozilla/5.0'},pool:httpAgent});        
        const $ = cheerio.load(body);
        const selectDeputados = $('#deputado option:not(:selected)');
        const listOfIDs = selectDeputados.map((i,option)=> {
            let startIndex = $(option).prop('value').indexOf('?')+1;    
                return $(option).prop('value').substring(startIndex);
            }).get();                    
        
        for(let id of listOfIDs) {
            const deputy = await loadDeputyDetails(id);            
            await request.post({uri:'http://localhost:3000/api/data',body:deputy,json:true});            
        }       

    } catch(err) {
        console.log(err)
    }
}

/**
 * Builds deputy object
 * @param Number id - deputy id
 */
const loadDeputyDetails = async (id) => {    
    const deputy = { siteId:id,matricula:"",authorId:"",fullName:"", party:"", birthday: "", state: "", main:"",
            contactInformation: {email:"",phone:"",fax:""}, imgUrl:"",commissions:[],votesIn2018:[],
            attendanceIn2018:[],recentPropositions:[] };
    
    const body = await request.get({url:`http://www.camara.leg.br/internet/Deputado/dep_Detalhe.asp?id=${id}`, 
        headers:{'User-Agent':'Mozilla/5.0'},pool:httpAgent})
       
    deputy.matricula = body.match(/nuMatricula=([\d]+)/)[1];
    deputy.authorId = body.match(/Autor=([\d]+)/)[1];
    
    //const attendanceBody = await request.get({url:`http://www.camara.leg.br/internet/deputado/RelPresencaPlenario.asp?nuLegislatura=55&nuMatricula=${deputy.matricula}&dtInicio=01/01/2018&dtFim=30/12/2018`, 
    //    headers:{'User-Agent':'Mozilla/5.0'},pool:httpAgent})

    const propositionBody = await request.get({url:`http://www.camara.gov.br/internet/sileg/Prop_lista.asp?Autor=${deputy.authorId}&Limite=N`, 
        headers:{'User-Agent':'Mozilla/5.0'},pool:httpAgent})
            
    mapDeputyInformation(body,deputy);
    //mapAttendanceInformation(attendanceBody,deputy);  - 503
    mapPropositionInformation(propositionBody,deputy); 
    
    return deputy;
}    

/**
 * Parses html from request to http://www.camara.leg.br/internet/Deputado/dep_Detalhe.asp and maps it to deputy object
 * @param String body - response body
 * @param Deputy deputy - deputy object
 */
const mapDeputyInformation = (body,deputy) => {
    const $ = cheerio.load(body);
    const deputyInfo = $('ul.visualNoMarker');
    
    deputy.imgUrl = $('img.image-left').attr('src');        
    
    const data = deputyInfo.eq(0).find('li');
    deputy.fullName = data.eq(0).text().split(/:\s/)[1];
    
    let _birthday = data.eq(1).text().match(/(\d+\s\/\s\d+)/)[0];
    _birthday = _birthday.replace(/(\s\/\s)/,'-');
    deputy.birthday = _birthday;
    
    let _party = data.eq(2).text().split(/\s\/\s/);
    deputy.party = _party[0].split(/:\s/)[1];
    deputy.state = _party[1];
    deputy.main = _party[2]==='Titular' ? true : false;
    
    deputy.contactInformation.phone = data.eq(3).text().match(/\(\d+\)\s\d+-\d+/)[0];
    deputy.contactInformation.fax = data.eq(3).text().match(/(\d+-\d+)/g)[1];                             

    const contactData = deputyInfo.eq(4).find('li:nth-child(-n+3)').text().split('\n');
    deputy.contactInformation.email = $('[href^=mailto]').text();

    const comissionMain = deputyInfo.eq(2).find('li:first-of-type');
    const comissionAlternate = deputyInfo.eq(2).find('li:last-of-type');

    comissionMain.find('acronym').each((i,elem)=>{
        deputy.commissions.push({description:$(elem).attr('title'),acronym:$(elem).text(),main:true})            
    })

    comissionAlternate.find('acronym').each((i,elem)=>{
        deputy.commissions.push({description:$(elem).attr('title'),acronym:$(elem).text(),main:false})            
    })
}         

/**
 * Parses html from request to http://www.camara.leg.br/internet/deputado/RelPresencaPlenario.asp and
 * maps it to deputy object
 * @param String body - response body
 * @param Deputy deputy - deputy object
 */
const mapAttendanceInformation = (body,deputy) => {
    const $ = cheerio.load(body);
    const table = $('.tabela-2 tr').each((i,elem)=> {
    const items = $(elem).find('td');
    deputy.attendanceIn2018.push({
        description:items.eq(0).text().trim(),
        days: items.eq(1).text().trim(),
        percentage:items.eq(2).text().trim()})               
    });
}

/**
 * Parses html from request to http://www.camara.gov.br/internet/sileg/Prop_lista.asp and 
 * maps it to deputy object
 * @param String body - response body
 * @param Deputy deputy - deputy object
 */
const mapPropositionInformation = (body,deputy) => {    
    const $ = cheerio.load(body);
    const table = $('tbody.coresAlternadas').each((i,elem)=> {
        const items = $(elem).find('tr');
        const firstRow = items.eq(0).find('td')
        const secondRow = items.eq(1).find('td')
        const date = secondRow.eq(1).find('p:nth-of-type(2)').html().split('<br>')[0];
        const details = secondRow.eq(1).find('p:nth-of-type(2)').html().split('<br>')[1];

        deputy.recentPropositions.push({
            title:firstRow.eq(0).text().trim(),
            status:firstRow.eq(2).text().trim(),
            date:$(date).text(),
            details:$(details).text()})               
    });    
}

loadDeputies('http://www2.camara.leg.br/deputados/pesquisa')