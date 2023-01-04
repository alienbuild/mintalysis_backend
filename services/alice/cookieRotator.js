const cookies = [
    "veve=s%3AAUbLV_hdwqgSds39ba-LlSIWPctzMBvz.jqXB%2BtkpAX7pk3gAPUIXNfWJbJuasxn0HNolxuGRsKI",
    "veve=s%3ACoX5ejo8f9K_wLVqERC4S5BZsWtnSEdd.ryZk5c1E7OW58ZomE5q4C8FXbE6%2FIEPNcTy%2FTnsKyuY",
]

export const cookieRotator = () => {
    return cookies[Math.floor(Math.random() * cookies.length)]
}