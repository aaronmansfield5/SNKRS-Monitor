const request = require('request')
const {
    EmbedBuilder
} = require('discord.js')
const fs = require('fs')

let a = false

let next = "/product_feed/threads/v2?filter=marketplace%28GB%29&filter=language%28en-GB%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&anchor=0&count=100&fields=active%2Cid%2ClastFetchTime%2CproductInfo%2CpublishedContent.nodes%2CpublishedContent.subType%2CpublishedContent.properties.coverCard%2CpublishedContent.properties.productCard%2CpublishedContent.properties.products%2CpublishedContent.properties.publish.collections%2CpublishedContent.properties.relatedThreads%2CpublishedContent.properties.seo%2CpublishedContent.properties.threadType%2CpublishedContent.properties.custom%2CpublishedContent.properties.title"

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
                                url: `https://www.nike.com/gb/launch/t/${item.productInfo[0].productContent.slug}`
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
                                    text: "Nike",
                                    iconURL: "https://cdn.discordapp.com/attachments/994594646489567312/1001233877022539936/image_1.png"
                                })
                                .setColor(`#${itemData.color}`)
                            let sizeString = ""
                            let sCount = 0
                            Object.keys(itemData.sizes).forEach(key => {
                                if (key != "inStock") {
                                    let availability = itemData.sizes[key]
                                    sizeString += `UK ${key} [${availability}]\n`
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
                                value: `[StockX](https://stockx.com/search?s=${item.productInfo[0].merchProduct.styleColor})`,
                                inline: false
                            })
                            if (itemData.stylecode != "AJ1986-001") {
                                if (!itemList.hasOwnProperty(itemData.stylecode)) {
                                    itemList[itemData.stylecode] = JSON.stringify(itemData.sizes)
                                    embed.addFields({
                                        name: "Restock",
                                        value: "FALSE :x:",
                                        inline: true
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
        next = "/product_feed/threads/v2?filter=marketplace%28GB%29&filter=language%28en-GB%29&filter=channelId%28010794e5-35fe-4e32-aaff-cd2c74f89d61%29&filter=exclusiveAccess%28true%2Cfalse%29&anchor=0&count=100&fields=active%2Cid%2ClastFetchTime%2CproductInfo%2CpublishedContent.nodes%2CpublishedContent.subType%2CpublishedContent.properties.coverCard%2CpublishedContent.properties.productCard%2CpublishedContent.properties.products%2CpublishedContent.properties.publish.collections%2CpublishedContent.properties.relatedThreads%2CpublishedContent.properties.seo%2CpublishedContent.properties.threadType%2CpublishedContent.properties.custom%2CpublishedContent.properties.title"
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