document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('http://localhost:3000/rooms');
        const data = await response.json();
        const roomContainer = document.getElementById('roomContainer');
        const user = JSON.parse(localStorage.getItem('user'));

        data.forEach(room => {
            const roomDiv = document.createElement('div');
            roomDiv.classList.add('room-container', room.status === 'ocupada' ? 'ocupada' : 'disponivel');
            roomDiv.dataset.roomId = room._id; 

            let formattedstartTime = 'Disponível';
            let formattedendTime = '';

            if (room.startTime && room.endTime) {
                formattedstartTime = new Date(room.startTime).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
                formattedendTime = new Date(room.endTime).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
            }

            roomDiv.innerHTML = `
                <div class="room-header">
                    <div class="room-name">${room.name}</div>
                    <div class="room-status">${room.status === 'ocupada' ? 'Ocupada' : 'Disponível'}</div>
                </div>
                <div class="room-body">
                    <div class="room-description">${room.description}</div>
                    <div class="room-schedule">${room.status === 'ocupada' ? `Ocupada de ${formattedstartTime} às ${formattedendTime}` : ''}</div>
                    ${room.status !== 'ocupada' ? `<button class="btn-reserve" data-room-id="${room._id}">Reservar</button>` : ''}
                    ${room.status === 'ocupada' && room.reservedBy === user._id ? `<button class="btn-cancel" data-room-id="${room._id}">Cancelar Reserva</button>` : ''}
                </div>
            `;
            roomContainer.appendChild(roomDiv);
        });

        activateReserveButtons();
        activateCancelButtons();
 
    } catch (error) {
        console.error('Erro ao carregar salas de reunião:', error);
    }

    setupModalControls();
});

function activateReserveButtons() {
    const reserveButtons = document.querySelectorAll('.btn-reserve');
    reserveButtons.forEach(button => {
        button.addEventListener('click', function () {
            document.getElementById('modal').style.display = 'block';
            document.getElementById('reserveButton').setAttribute('data-room-id', this.dataset.roomId);
        });
    });
}

function setupModalControls() {
    const modal = document.getElementById('modal');
    const closeButton = document.querySelector('.close');
    const reserveButton = document.getElementById('reserveButton');

    closeButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    reserveButton.addEventListener('click', function () {
        const roomId = this.getAttribute('data-room-id');
        const startTime = formatISODateTime('startTime');
        const endTime = formatISODateTime('endTime');
        const participants = document.getElementById('reserverName').value;
        if (!startTime || !endTime || !participants) {
            alert('Por favor, preencha todas as informações necessárias.');
            return;
        }

        reserveRoom(roomId, startTime, endTime, participants);
        modal.style.display = 'none';
    });
}



function updateRoomListAfterReservation(roomId) {
    const roomDiv = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomDiv) {
        roomDiv.classList.remove('disponivel');
        roomDiv.classList.add('ocupada');
        const reserveButton = roomDiv.querySelector('.btn-reserve');
        if (reserveButton) {
            reserveButton.remove();
        }
        const roomStatus = roomDiv.querySelector('.room-status');
        if (roomStatus) {
            roomStatus.textContent = 'Ocupada';
        }
        const roomSchedule = roomDiv.querySelector('.room-schedule');
        if (roomSchedule) {
            roomSchedule.textContent = 'Ocupada até o horário de término da reserva';
        }
        // Adicione o botão de cancelamento da reserva
        const cancelButton = document.createElement('button');
        cancelButton.classList.add('btn-cancel');
        cancelButton.dataset.roomId = roomId;
        cancelButton.textContent = 'Cancelar Reserva';
        const roomBody = roomDiv.querySelector('.room-body');
        if (roomBody) {
            roomBody.appendChild(cancelButton);
        }
        activateCancelButtons();
    }
}

async function reserveRoom(roomId, startTime, endTime, participants) {
    try {
        const user = localStorage.getItem('user') != null ? JSON.parse(localStorage.getItem('user')) : {};
        const token = localStorage.getItem('token') != null ? localStorage.getItem('token') : '';
        const reservedBy = user._id;
        const response = await fetch(`http://localhost:3000/rooms/${roomId}/reserve/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ startTime, endTime, participants, reservedBy })
        });

        if (!response.ok) {
            throw new Error('Erro ao reservar sala.');
        }

        const data = await response.json();
        console.log('Reserva feita com sucesso!', data);

        updateRoomListAfterReservation(roomId);

        showSuccessPopup();
        window.location.reload();
    } catch (error) {
        console.error('Erro ao reservar sala:', error);
        showErrorPopup('Erro ao reservar sala.');
    }
}

async function cancelRoomReservation(roomId, userId) {
    try {
        const token = localStorage.getItem('token') != null ? localStorage.getItem('token') : '';
    
        const response = await fetch(`http://localhost:3000/rooms/${roomId}/cancel/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            throw new Error('Erro ao cancelar reserva.');
        }

        const data = await response.json();
        console.log('Reserva cancelada com sucesso!', data);

        updateRoomListAfterCancellation(roomId);

        showSuccessPopup('Reserva cancelada com sucesso!');
    } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        showErrorPopup('Erro ao cancelar reserva.');
    }
}

function activateCancelButtons() {
    const cancelButtons = document.querySelectorAll('.btn-cancel');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function () {
            const roomId = this.dataset.roomId;
            const userId = JSON.parse(localStorage.getItem('user'))._id;
            cancelRoomReservation(roomId, userId);
        });
    });
}

function updateRoomListAfterCancellation(roomId) {
    const roomDiv = document.querySelector(`[data-room-id="${roomId}"]`);
    if (roomDiv) {
        roomDiv.classList.remove('ocupada');
        roomDiv.classList.add('disponivel');
        const cancelButton = roomDiv.querySelector('.btn-cancel');
        if (cancelButton) {
            cancelButton.remove();
        }
        const roomStatus = roomDiv.querySelector('.room-status');
        if (roomStatus) {
            roomStatus.textContent = 'Disponível';
        }
        const roomSchedule = roomDiv.querySelector('.room-schedule');
        if (roomSchedule) {
            roomSchedule.textContent = '';
        }
        const reserveButton = document.createElement('button');
        reserveButton.classList.add('btn-reserve');
        reserveButton.dataset.roomId = roomId;
        reserveButton.textContent = 'Reservar';
        const roomBody = roomDiv.querySelector('.room-body');
        if (roomBody) {
            roomBody.appendChild(reserveButton);
        }
        activateReserveButtons();
    }
}

function showSuccessPopup(message = 'Sala reservada com sucesso!') {
    alert(message);
}

function showErrorPopup(message) {
    alert(message);
}

function formatISODateTime(inputElementId) {
    const inputElement = document.getElementById(inputElementId);
    if (!inputElement || !inputElement.value) {
        console.error('Elemento ou valor do elemento não encontrado:', inputElementId);
        return null;
    }

    const dateTimeValue = inputElement.value;
    const dateTime = new Date(dateTimeValue + ':00.000Z'); // Adiciona segundos e zona horária UTC
    return dateTime.toISOString();
}
