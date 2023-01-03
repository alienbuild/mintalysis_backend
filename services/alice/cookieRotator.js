const cookies = [
    "veve=s%3ANwhYZRG3Q1ChvLrBqRpYNq8YoxPAoUqj.fpMnMjgTkPZAJI1trSwesJKxDoQ1vAg5vkVEXG6YI1w"
]

export const cookieRotator = () => {
    return cookies[Math.floor(Math.random() * cookies.length)]
}