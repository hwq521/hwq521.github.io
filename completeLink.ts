type findPathResult = null | {
    path: string;
    index: number;
}
type otherProcessingType = {
    url: string;
    do: Function;
}
// 屏蔽js的页面
const errorJsPage: string[] = [
    // 'www.jl.gov.cn'
]
// 特定页面的特殊处理
const otherProcessing: otherProcessingType[] = [
    {
        url: 'www.jl.gov.cn',
        do: function (html: string) {
            return html.replace(/<body/, function (e) {
                console.log(e)
                return '<body style="display:block"';
            })
        }
    }
]
/**
 * 
 * @method 替换地址
 * @param link 将要替换的链接
 * @param homeLink url链接
 * @returns 替换完成的链接
 */
function replaceUrl(link: string, homeLink: string) {
    link = link.replace(/^\s*|\s*$/g, "") // 去除两边的空格
    homeLink = homeLink.replace(/^\s*|\s*$/g, "") // 去除两边的空格
    // 链接里带有引号的直接返回
    if (link.split('"').length > 1 || link.split("'").length > 1) return link;
    const findPathStr = findPath(link);
    if (findPathStr) {
        if (findPathStr.path === '/') {
            console.log(findUrlHome(homeLink, findPathStr.index), link)
            return findUrlHome(homeLink, findPathStr.index) + link
        } else {
            return link.replace(
                findPathStr.path,
                findUrlHome(homeLink, findPathStr.index)
            );
        }
    } else {
        return link;
    }
}

/**
 * 
 * @method 查询路径跳转次数
 * @param link 链接
 * @returns null|{path:string, index: number}
 */
function findPath(link: string): findPathResult {
    const isHttpHttps = link.split("//");
    if (isHttpHttps[1]) return null;
    const splitArr = link.split("/");
    const notPathIndex = splitArr.findIndex(i => !i.match(/^\.\.$/));
    if (notPathIndex > -1) {
        return {
            path: splitArr.slice(0, notPathIndex).join("/") + "/",
            index: notPathIndex
        };
    } else {
        return {
            path: '/',
            index: 0
        };
    }
}

/**
 *
 * @param link 传入的url链接
 * @param index 需要根据/分割的索引
 * @param isAfter 是否从后往前分割
 * @returns
 */
function findUrlHome(link: string, index: number, isAfter = true) {
    const urlSplit = link.split("//");
    const pathSplit = urlSplit[1].split("/");
    let urlHome:never|string[] = [];
    if (isAfter) {
        urlHome = pathSplit.slice(0, pathSplit.length - (index + 1));
    } else {
        urlHome = pathSplit.slice(0, index + 1);
    }
    return urlHome ? `${urlSplit[0]}//${urlHome.join("/")}/` : "";
}
/**
 * @method 补齐css和js的html字符串函数
 * @param htmlStr html字符串
 * @param homeLink 抓取快照的链接
 * @returns 补齐css和js的html字符串
 */
export function completeLink(htmlStr: string, homeLink: string) {
    if (!htmlStr) return "";
    // 特定页面屏蔽js
    // let url = null;
    // url = {
    //     isReplaceJs: !(errorJsPage.findIndex(i => homeLink.indexOf(i) > -1) > -1)
    // }
    // url = null
    const findKey = otherProcessing.findIndex(i => homeLink.indexOf(i.url) > -1);
    if (findKey > -1) {
        htmlStr = otherProcessing[findKey].do(htmlStr);
    }
    const result = htmlStr
        .replace(/(?<=<script.*src=")([^"]*)(?=")/g, function (item) {
            // return url.isReplaceJs ? replaceUrl(item, homeLink) : item; // 特定页面屏蔽js
            return replaceUrl(item, homeLink);
        })
        .replace(/(?<=<link.*href=")([^"]*)(?=")/g, function (item) {
            return replaceUrl(item, homeLink);
        })
        .replace(/(?<=<iframe.*src=")([^"]*)(?=")/g, function (item) {
            return replaceUrl(item, findUrlHome(homeLink, 0, false));
        }).replace(/(?<=<img.*src=")([^"]*)(?=")/g, function (item) {
            return replaceUrl(item, homeLink)
        }).replace(/ url\(\"?'?.*"?'?\)/g, function (item) {
            return replaceUrl(item.replace(/"|'|url|\(|\)/g, ''), homeLink);
        });
    return result
}
