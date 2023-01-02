const cookies = [
    "veve=s%3AAUbLV_hdwqgSds39ba-LlSIWPctzMBvz.jqXB%2BtkpAX7pk3gAPUIXNfWJbJuasxn0HNolxuGRsKI",
    "veve=s%3AdA0hTi88dd9DWudIr0j5f0RnPjWkHj2n.X9V7C%2Fj5uk5zzJHhQiW9BV%2BCRiQuEIdhSdNVXCGmo1A",
    "veve=s%3ACoX5ejo8f9K_wLVqERC4S5BZsWtnSEdd.ryZk5c1E7OW58ZomE5q4C8FXbE6%2FIEPNcTy%2FTnsKyuY",
    "veve=s%3A4HEWjjjN1O5y_wyF4VDCrI2GWLOAcZKq.Yy75i4jRkRrybqnXh1oReIJKvfOL6ONnpLSqKu0rCxM",
    "veve=s%3Aep95cDuYeBtkfcOZIYiXAklp3wyBJLcx.EKN4JCHPIlVPHhMMemsLZRa%2FrPWyUOpm3c%2BzkOzsSMk",
]

export const cookieRotator = () => {
    return cookies[Math.floor(Math.random() * cookies.length)]
}