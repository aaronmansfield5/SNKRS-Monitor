const request = require('request')
const {
    EmbedBuilder
} = require('discord.js')
const fs = require('fs')
const region = "gb" //https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes/blob/master/all/all.csv (Alpha-2)

let a = false

let next = `/product_feed/threads/v2/?anchor=0&count=100&filter=marketplace%28${region.toUpperCase()}%29&filter=language%28${region == "gb" ? "en-GB" : region}%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active%2Cid%2ClastFetchTime%2CproductInfo%2CpublishedContent.nodes%2CpublishedContent.subType%2CpublishedContent.properties.coverCard%2CpublishedContent.properties.productCard%2CpublishedContent.properties.products%2CpublishedContent.properties.publish.collections%2CpublishedContent.properties.relatedThreads%2CpublishedContent.properties.seo%2CpublishedContent.properties.threadType%2CpublishedContent.properties.custom%2CpublishedContent.properties.title`

function sortSizes(skus, available) {
    if (available === undefined || skus === undefined) {
        return {};
    }

    return skus.reduce((sizes, size) => {
        available.forEach(inSize => {
            if (inSize.id === size.id && inSize.level !== "OOS") {
                sizes[size.nikeSize] = inSize.level
                sizes["inStock"] = inSize.available
            }
        })

        return sizes;
    }, {})
}

function getTime() {
    const date = new Date()
    return `${("0" + date.getDate()).slice(-2)}-${("0" + (date.getMonth() + 1)).slice(-2)}-${date.getFullYear()}T${date.getHours() < 10 ? "0" + date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}:${date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds()}.${date.getMilliseconds()}`
}

function getItems(channel, itemList) {
    let listClone = JSON.parse(JSON.stringify(itemList))
    if (next != "") {
        request(`https://api.nike.com${next}`, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let newData = JSON.parse(body)
                try {
                    next = newData.pages.next
                    newData.objects.forEach(item => {
                        if (item.productInfo) {
                            let channels = ""
                            item.productInfo[0].merchProduct.channels.forEach(store => {
                                item.productInfo[0].merchProduct.channels[item.productInfo[0].merchProduct.channels.length - 1] == store ? channels += `${store}` : channels += `${store} • `
                            })
                            let sizeData = sortSizes(item.productInfo[0].skus, item.productInfo[0].availableSkus)
                            let itemData = {
                                name: item.productInfo[0].productContent.fullTitle,
                                region: `:flag_${item.productInfo[0].merchProduct.merchGroup.toLowerCase()}:`,
                                price: `£${item.productInfo[0].merchPrice.currentPrice}`,
                                description: item.productInfo[0].productContent.description.replace(/<[^>]+>|&[^;]+;/g, ''),
                                colorway: item.productInfo[0].productContent.colorDescription,
                                stylecode: item.productInfo[0].merchProduct.styleColor,
                                cover: item.productInfo[0].imageUrls.productImageUrl,
                                status: item.productInfo[0].merchProduct.status,
                                gender: item.productInfo[0].merchProduct.genders[0],
                                dropDate: item.productInfo[0].merchProduct.commerceStartDate.substring(0, 10),
                                category: item.productInfo[0].merchProduct.productType,
                                color: item.productInfo[0].productContent.colors[0].hex,
                                sizes: sizeData,
                                drops: channels,
                                available: sizeData.inStock ^ false,
                                url: `https://www.nike.com/${region}/launch/t/${item.productInfo[0].productContent.slug}`
                            }
                            let embed = new EmbedBuilder()
                                .setTitle(`${itemData.name} ${itemData.colorway}`)
                                .setThumbnail(itemData.cover)
                                .setURL(itemData.url)
                                .addFields({
                                    name: "Price",
                                    value: itemData.price,
                                    inline: true
                                }, {
                                    name: "Live",
                                    value: itemData.available.toString() == "1" ? `${item.productInfo[0].merchProduct.status == "ACTIVE" ? `${item.productInfo[0].merchProduct.status} :white_check_mark:` : `${item.productInfo[0].merchProduct.status} :x:`}` : `Out Of Stock :x:`,
                                    inline: true
                                }, {
                                    name: "Product Type",
                                    value: itemData.category,
                                    inline: true
                                }, {
                                    name: "Style Code",
                                    value: itemData.stylecode,
                                    inline: true
                                }, {
                                    name: "Commerce Date",
                                    value: itemData.dropDate,
                                    inline: true
                                }, {
                                    name: "Region",
                                    value: itemData.region,
                                    inline: true
                                })
                                .setFooter({
                                    text: itemData.drops,
                                    iconURL: "https://cdn.discordapp.com/attachments/971519655615295508/993868941464174592/piet-parra-wave-dribbble-05.png"
                                })
                                .setColor(`#${itemData.color}`)
                            let sizeString = ""
                            let sCount = 0
                            Object.keys(itemData.sizes).forEach(key => {
                                if (key != "inStock") {
                                    let availability = itemData.sizes[key]
                                    sizeString += `${region.toUpperCase()} ${key} [${availability}]\n`
                                    sCount++
                                    if (sCount === 6) {
                                        embed.addFields({
                                            name: "Sizes",
                                            value: sizeString.length != 0 ? sizeString : "N/A",
                                            inline: true
                                        })
                                        sCount = 0
                                        sizeString = ""
                                    }
                                }
                            })
                            if (sizeString != "" && sCount != 0) {
                                embed.addFields({
                                    name: "Sizes",
                                    value: sizeString.length != 0 ? sizeString : "N/A",
                                    inline: true
                                })
                                sCount = 0
                                sizeString = ""
                            }
                            embed.addFields({
                                name: "Links",
                                value: `[StockX](https://stockx.com/search?s=${itemData.stylecode.replaceAll("-","")})`,
                                inline: true
                            })
                            if (itemData.stylecode != "AJ1986-001") {
                                if (!itemList.hasOwnProperty(itemData.stylecode)) {
                                    itemList[itemData.stylecode] = JSON.stringify(itemData.sizes)
                                    embed.addFields({
                                        name: "Restock",
                                        value: "FALSE :x:",
                                        inline: true
                                    })
                                    embed.addFields({
                                        name: "Posted At",
                                        value: getTime(),
                                        inline: false
                                    })
                                    itemData.available && item.productInfo[0].merchProduct.status == "ACTIVE" ? channel.send({
                                        embeds: [embed]
                                    }) : channel.guild.channels.cache.find(c => c.name === `${channel.name}-inactive`).send({
                                        embeds: [embed]
                                    })
                                } else {
                                    if (itemList[itemData.stylecode] != JSON.stringify(itemData.sizes)) {
                                        itemList[itemData.stylecode] = JSON.stringify(itemData.sizes)
                                        embed.addFields({
                                            name: "Restock",
                                            value: "TRUE :white_check_mark:",
                                            inline: true
                                        })
                                        embed.addFields({
                                            name: "Posted At",
                                            value: getTime(),
                                            inline: false
                                        })
                                        itemData.available && item.productInfo[0].merchProduct.status == "ACTIVE" ? channel.send({
                                            embeds: [embed]
                                        }) : channel.guild.channels.cache.find(c => c.name === `${channel.name}-inactive`).send({
                                            embeds: [embed]
                                        })
                                    }
                                }
                            }
                        }
                    });
                    if (JSON.stringify(listClone) != JSON.stringify(itemList)) {
                        fs.writeFileSync('./data/nike.json', JSON.stringify(itemList, null, "\t"))
                    }
                } catch (error) {
                    a = true
                }
            } else {
                console.log(error)
            }
        })
    } else {
        next = `/product_feed/threads/v2/?anchor=0&count=100&filter=marketplace%28${region.toUpperCase()}%29&filter=language%28${region == "gb" ? "en-GB" : region}%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&fields=active%2Cid%2ClastFetchTime%2CproductInfo%2CpublishedContent.nodes%2CpublishedContent.subType%2CpublishedContent.properties.coverCard%2CpublishedContent.properties.productCard%2CpublishedContent.properties.products%2CpublishedContent.properties.publish.collections%2CpublishedContent.properties.relatedThreads%2CpublishedContent.properties.seo%2CpublishedContent.properties.threadType%2CpublishedContent.properties.custom%2CpublishedContent.properties.title`
    }
}

function startSearching(channel, itemList = JSON.parse(fs.readFileSync('./data/nike.json'))) {
    return setInterval(getItems, 1500, channel, itemList)
}

function stopSearching(id) {
    clearInterval(id)
}

module.exports = {
    startSearching,
    stopSearching
}
