document.addEventListener('DOMContentLoaded', async () => {

    try {
        const response = await fetch('http://localhost:3000/rooms');
        const data = await response.json();
        const roomContainer = document.getElementById('roomContainer');

        data.forEach(room => {
            const roomDiv = document.createElement('div');
            roomDiv.classList.add('room-container', room.status === 'ocupada' ? 'ocupada' : 'disponivel');

        

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
                    <div class="room-schedule">${room.status === 'ocupada' ? `Ocupada de ${formattedstartTime} ás ${formattedendTime}` : ''}</div>
                    ${room.status !== 'ocupada' ? `<button class="btn-reserve" data-room-id="${room._id}">Reservar</button>` : ''}
                </div>
            `;
            roomContainer.appendChild(roomDiv);
        });

        // Ativa os botões de reserva
        activateReserveButtons();
    } catch (error) {
        console.error('Erro ao carregar salas de reunião:', error);
    }

    setupModalControls();
});

function activateReserveButtons() {
    const reserveButtons = document.querySelectorAll('.btn-reserve');
    reserveButtons.forEach(button => {
        button.addEventListener('click', function() {
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

    reserveButton.addEventListener('click', function() {
        const roomId = this.getAttribute('data-room-id');
        const startTime = formatISODateTime('startTime');
        const endTime = formatISODateTime('endTime');
        const participants = document.getElementById('reserverName').value;
        if (!startTime || !endTime || !participants) {
            alert('Por favor, preencha todas as informações necessárias.');
            return;
        }

        reserveRoom(roomId, startTime, endTime, participants);
        modal.style.display = 'none'
    });
}

async function reserveRoom(roomId, startTime, endTime, reserverName) {
    try {
        const response = await fetch(`http://localhost:3000/rooms/${roomId}/reserve/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startTime, endTime, reserverName })
        });

        if (!response.ok) {
            throw new Error('Erro ao reservar sala.');
        }

        const data = await response.json();
        console.log('Reserva feita com sucesso!', data);
    } catch (error) {
        console.error('Erro ao reservar sala:', error);
    }
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


