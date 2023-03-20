const cookies = [
    "veve=s%3AAUbLV_hdwqgSds39ba-LlSIWPctzMBvz.jqXB%2BtkpAX7pk3gAPUIXNfWJbJuasxn0HNolxuGRsKI",
    ""
]

export const cookieRotator = () => {
    return cookies[Math.floor(Math.random() * cookies.length)]
}