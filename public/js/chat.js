//this client side js file use the socket.io js file
const socket = io()


/* //EXAMPLE to send counter variable between clients

//to receive the event the server is sending to us
//the event name must mathc with the event name on the server side socket.emit name
socket.on('countUpdated', (count)=>{
    console.log('The counter has been updated' , count);

}) 

//allow the client to click a button and increment the count
document.querySelector('#increment').addEventListener('click', ()=>{
    console.log('clicked');

    //send the server the 
    //dont need to send data. coz the servr knows the count and just need to add 1 to it
    socket.emit('increment')
})

*/

//Elements
//not mandatory to have dollar sign before element name .. its just a regular practice to know the DOM selection
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $messages = document.querySelector('#messages')


//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate  = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true}) /// takes the query string by default browser provided location.search 


//adding autoscrolling feature
const autoscroll = () => {
    //new messge
    const $newMessage = $messages.lastElementChild


    //height of new message
    const newMessageStyles = getComputedStyle($newMessage) // margin bottom etc spaces calculation
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages constainer
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if( containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}



socket.on('message',(message) => {
    console.log(message);

    // this is going to store final data going to be rendered to web-page
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text ,/// mustache will render that message to the end of div tag
        createdAt: moment(message.createdAt).format('MMMM Do YYYY, h:mm:ss A')
    }) 

    $messages.insertAdjacentHTML('beforeend', html) // the newer message will be situated before the div tag ends 
    autoscroll()
})

socket.on('locationMessage', (message) => {
    console.log(message);

    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('MMM Do YYYY, h:mm:ss A')
   }) 

   $messages.insertAdjacentHTML('beforeend', html) 
   autoscroll()
})

socket.on('roomData', ({room, users}) => {
    // console.log(room);
    // console.log(users);

    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault() //to prevent defult full page refresh

    //disabling the button till the result is sent
    $messageFormButton.setAttribute('disabled', 'disabled')


    // const message = document.querySelector('input').value // another alternative and safe way is....
   const message = e.target.elements.message.value

   /*
   //server(emit) -> client(receiver) => acknowlwdgement sent beck to ->server
    // client(emit) -> server (receiver) => acknowlwdgement  sent beck to  -> client

   //3 rd arguemt will run when the action was acknowledged
    socket.emit('sendMessage',message, (message) => {
        console.log(`The message was delivered.`, message );
    })
    */

    socket.emit('sendMessage',message, (error) => {
        
        //enabling the button after the message is sent
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''  //clear input after message been sent to server
        $messageFormInput.focus() // refocusing the cursor in the input box

        if(error){
            return console.log(error);
        }

        console.log(`The message was delivered.`)
    })


})

//elements for send location button
const $sendLocationButton =document.querySelector('#send-location')

$sendLocationButton.addEventListener('click', () => {

    //check if this property exist for given browser and os
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }

    $sendLocationButton.setAttribute('disabled', 'disabled') // disable the buttton

    //position is provided bu getCurrentPosition as an argument to the funtion ..which contains data about location
    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position);
        
        socket.emit('sendLocation',{
            latitude: position.coords.latitude,
            longitude: position.coords.longitude

        }, (e) => {

            //enable the button once again
            $sendLocationButton.removeAttribute('disabled')

            console.log(`Location shared!`)
        })
    })
})

socket.emit('join', { username, room} , (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})