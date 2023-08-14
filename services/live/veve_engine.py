import requests
import mysql.connector
import time
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# def get_unique_owners():
#TODO SWITCH TO VEVE_TOKENS ONCE COMPLETED

db_config= {
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'host': os.getenv('DB_HOST'),
    'database': os.getenv('DB_NAME')
}

db_connection = mysql.connector.connect(**db_config)
cursor = db_connection.cursor()

mint_endpoint = 'https://api.x.immutable.com/v1/mints'
transfer_endpoint = 'https://api.x.immutable.com/v1/transfers'

def close_db_connection():
    cursor.close()
    db_connection.close()
    print('Database connection closed.')

def add_leftover_veve_wallets():
    # Insert wallets from mints into veve_wallets
    query = """
    INSERT INTO veve_wallets (id)
    SELECT DISTINCT wallet_id
    FROM veve_mints AS m
    LEFT JOIN veve_wallets AS w ON w.id = m.wallet_id
    WHERE w.id IS NULL
    """
    cursor.execute(query)
    db_connection.commit()

    # Insert wallets from transfers into veve_wallets
    query = """
    INSERT INTO veve_wallets (id)
    SELECT DISTINCT to_wallet
    FROM veve_transfers AS t
    LEFT JOIN veve_wallets AS w ON w.id = t.from_wallet
    WHERE w.id IS NULL
    """
    cursor.execute(query)
    db_connection.commit()

def get_wallet_count():
    query = "SELECT COUNT(*) FROM veve_wallets"
    cursor.execute(query)
    result = cursor.fetchone()
    wallet_count = result[0]
    return wallet_count

def get_token_count():
    query = "SELECT COUNT(*) FROM veve_mints"
    cursor.execute(query)
    result = cursor.fetchone()
    token_count = result[0]
    return token_count

def get_transaction_count():
    query = "SELECT COUNT(*) FROM veve_transfers"
    cursor.execute(query)
    result = cursor.fetchone()
    transaction_count = result[0]
    return transaction_count

def get_max_mints_timestamp_txn_id():
    query = "SELECT MAX(timestamp), MAX(id) FROM veve_mints"
    cursor.execute(query)
    result = cursor.fetchone()
    max_mints_timestamp, last_updated_mint_txn_id = result
    return max_mints_timestamp, last_updated_mint_txn_id

def get_max_transfers_timestamp_txn_id():
    query = "SELECT MAX(timestamp), MAX(id) FROM veve_transfers"
    cursor.execute(query)
    result = cursor.fetchone()
    max_transfers_timestamp, last_updated_transfer_txn_id = result
    return max_transfers_timestamp, last_updated_transfer_txn_id

def get_unique_owners_count():
    query = "SELECT COUNT(DISTINCT wallet_id) FROM odb_tokens"
    cursor.execute(query)
    result = cursor.fetchone()
    owners_count = result[0]
    return owners_count

def update_imx_stats(wallet_count=None, token_count=None, transaction_count=None,
                     last_updated_mint_txn_id=None, last_updated_transfer_txn_id=None,
                     max_mints_timestamp=None, max_transfers_timestamp=None):
    
    base_query = "UPDATE imx_stats SET"
    update_expressions = []

    # Check each value and add it to the update expressions if provided - able to update one or all values
    if wallet_count is not None:
        update_expressions.append(f"wallet_count = {wallet_count}")
    if token_count is not None:
        update_expressions.append(f"token_count = {token_count}")
    if transaction_count is not None:
        update_expressions.append(f"transaction_count = {transaction_count}")
    if last_updated_mint_txn_id is not None:
        update_expressions.append(f"last_updated_mint_txn_id = {last_updated_mint_txn_id}")
    if last_updated_transfer_txn_id is not None:
        update_expressions.append(f"last_updated_transfer_txn_id = {last_updated_transfer_txn_id}")
    if max_mints_timestamp is not None:
        update_expressions.append(f"max_mints_timestamp = '{max_mints_timestamp}'")
    if max_transfers_timestamp is not None:
        update_expressions.append(f"max_transfers_timestamp = '{max_transfers_timestamp}'")

    # Combine the update expressions into the final query
    if update_expressions:
        final_query = f"{base_query} {', '.join(update_expressions)} WHERE project_id = 'de2180a8-4e26-402a-aed1-a09a51e6e33d'"
        cursor.execute(final_query)
        db_connection.commit()

# Reset all stats with table max counts/values after failure or initial start
def set_engine_values():
    #Adds wallets from veve_mints and veve_transfers that are not in veve_wallets in case of previous failure
    print('Getting current wallet count from veve_wallets.')
    before_wallet_count = get_wallet_count()

    print('Adding missing wallets to veve_wallets.')
    add_leftover_veve_wallets()

    print('Getting new wallet count from veve_wallets.')
    wallet_count = get_wallet_count()
    print(f'Added {wallet_count - before_wallet_count} missing wallets to veve_wallets.\n')

    print('Getting current token count from veve_mints.')
    token_count = get_token_count()

    print('Getting current transaction count from veve_transfers.')
    transaction_count = get_transaction_count()

    print('Getting max mint timestamp and id from veve_mints.')
    max_mints_timestamp, last_updated_mint_txn_id = get_max_mints_timestamp_txn_id()

    print('Getting max transfer timestamp and id from veve_transfers.')
    max_transfers_timestamp, last_updated_transfer_txn_id = get_max_transfers_timestamp_txn_id()

    print('Updating the correct values in the imx_stats table.') 
    update_imx_stats(wallet_count, token_count, transaction_count, last_updated_mint_txn_id, last_updated_transfer_txn_id, max_mints_timestamp, max_transfers_timestamp)

    print(f'\n\nUpdated the imx_stats table with the following values:\nmax_mints_timestamp: {max_mints_timestamp}\nmax_transfers_timestamp: {max_transfers_timestamp}.')
    print(f'\nlast_updated_mint_txn_id: {last_updated_mint_txn_id}\nlast_updated_transfer_txn_id: {last_updated_transfer_txn_id}.')
    print(f'\nwallet_count: {wallet_count}, token_count: {token_count}, and transaction_count: {transaction_count}.\n\n')
    print('ENGINE HAS BEEN STARTED!\n')

def insert_veve_mints(records):
    query = """
    INSERT INTO veve_mints (id, wallet_id, timestamp, token_id)
    VALUES (%s, %s, %s, %s)
    """
    cursor.executemany(query, records)
    db_connection.commit()

def process_mint_data(mint_data, max_timestamp_mints, last_updated_mint_txn_id, batch_size, wallets):
    mint_records = []
    highest_transaction_id = last_updated_mint_txn_id
    highest_timestamp = max_timestamp_mints
    new_mint_count = 0
    imx_stats = get_imx_stats()
    mint_count = imx_stats['token_count']

    for mint in mint_data['result']:
        transaction_id = mint['transaction_id']
        if transaction_id > last_updated_mint_txn_id:
            user = mint['user']
            token_id = mint['token']['data']['token_id']
            timestamp = mint['timestamp']
            wallets.append(user)
            mint_records.append((transaction_id, user, timestamp, token_id))
            new_mint_count += 1
            mint_count += 1
            update_imx_stats(token_count=mint_count)
            if len(mint_records) == batch_size:
                insert_veve_mints(mint_records)
                mint_records = []
            
            if transaction_id > highest_transaction_id:
                highest_transaction_id = transaction_id
            if timestamp > highest_timestamp:
                highest_timestamp = timestamp

    update_imx_stats(max_mints_timestamp=highest_timestamp, last_updated_mint_txn_id=highest_transaction_id)
    print(f'veve_mints highest transaction_id: {highest_transaction_id} - highest timestamp: {highest_timestamp}')
    print(f'Added {new_mint_count} mints to veve_mints. Total: {mint_count}\n')
    return mint_records


def insert_veve_transfers(records):
    query = """
    INSERT INTO veve_transfers (id, from_wallet, to_wallet, timestamp, token_id)
    VALUES (%s, %s, %s, %s, %s)
    """
    cursor.executemany(query, records)
    db_connection.commit()

def process_transfer_data(transfer_data, max_timestamp_transfers, last_updated_transfer_txn_id, batch_size, wallets):
    transfer_records = []
    highest_transaction_id = last_updated_transfer_txn_id
    highest_timestamp = max_timestamp_transfers
    new_transfer_count = 0
    imx_stats = get_imx_stats()
    transfer_count = imx_stats['transaction_count']

    for transfer in transfer_data['result']:
        transaction_id = transfer['transaction_id']
        if transaction_id > last_updated_transfer_txn_id:
            from_wallet = transfer['user']
            to_wallet = transfer['receiver']
            token_id = transfer['token']['data']['token_id']
            timestamp = transfer['timestamp']
            wallets.extend([from_wallet, to_wallet])
            transfer_records.append((transaction_id, from_wallet, to_wallet, timestamp, token_id))
            new_transfer_count += 1
            transfer_count += 1
            update_imx_stats(transaction_count=transfer_count)
            if len(transfer_records) == batch_size:
                insert_veve_transfers(transfer_records)
                transfer_records = []
            
            if transaction_id > highest_transaction_id:
                highest_transaction_id = transaction_id
            if timestamp > highest_timestamp:
                highest_timestamp = timestamp
                
    update_imx_stats(max_transfers_timestamp=highest_timestamp, last_updated_transfer_txn_id=highest_transaction_id)
    print(f'veve_transfers highest transaction_id: {highest_transaction_id} - highest timestamp: {highest_timestamp}')
    print(f'Added {new_transfer_count} transfers to veve_transfers. Total: {transfer_count}\n')
    return transfer_records

def get_imx_stats():
    query = "SELECT wallet_count, token_count, transaction_count, max_mints_timestamp, max_transfers_timestamp, last_updated_mint_txn_id, last_updated_transfer_txn_id FROM imx_stats WHERE project_id = 'de2180a8-4e26-402a-aed1-a09a51e6e33d'"
    cursor.execute(query)
    result = cursor.fetchone()
    column_names = ['wallet_count', 'token_count', 'transaction_count',
                    'max_mints_timestamp', 'max_transfers_timestamp',
                    'last_updated_mint_txn_id', 'last_updated_transfer_txn_id']
    return dict(zip(column_names, result))

def get_mint_and_transfer_data(min_timestamp_mints, min_timestamp_transfers, mint_cursor, transfer_cursor):
    token_address = '0xa7aefead2f25972d80516628417ac46b3f2604af'
    page_size = '200'
    direction = 'asc'
    order_by = 'transaction_id'

    mint_params = {
        'token_address': token_address,
        'min_timestamp': min_timestamp_mints,
        'page_size': page_size,
        'direction': direction,
        'order_by': order_by,
        'cursor': mint_cursor  # Include the mint cursor
    }

    transfer_params = {
        'token_address': token_address,
        'min_timestamp': min_timestamp_transfers,
        'page_size': page_size,
        'direction': direction,
        'order_by': order_by,
        'cursor': transfer_cursor  # Include the transfer cursor
    }

    mint_response = requests.get(mint_endpoint, params=mint_params)
    transfer_response = requests.get(transfer_endpoint, params=transfer_params)

    return mint_response, transfer_response

def update_veve_wallets(wallets):
    active_wallets = list(set(wallets))  # Get distinct wallets
    new_wallets = 0
    active = 1
    # KYC = 1 #TODO ADD KYC FIELD FOR ANY WALLETS THAT SOLD
    imx_stats = get_imx_stats()
    wallet_count = imx_stats['wallet_count']

    for wallet in active_wallets:
        query = "SELECT id FROM veve_wallets WHERE id = %s"
        cursor.execute(query, (wallet,))
        result = cursor.fetchone()
        if result is None: # Inserting a new wallet
            # TODO: Add first_activity_date and last_activity_date
            # try:
            #     first = datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%S.%fZ')
            # except ValueError:
            #     # Handle timestamps without fractional seconds
            #     timestamp = datetime.strptime(timestamp, '%Y-%m-%dT%H:%M:%SZ')
            insert_query = "INSERT INTO veve_wallets (id, active) VALUES (%s, %s)"
            cursor.execute(insert_query, (wallet, active))
            new_wallets += 1
            print(f'New wallet added: {wallet}')
            wallet_count += 1
            update_imx_stats(wallet_count)
        else: # Updating an existing wallet
            # TODO: Add first_activity_date and last_activity_date
            update_query = "UPDATE veve_wallets SET active = %s WHERE id = %s"
            cursor.execute(update_query, (active, wallet))

    print(f'Added {new_wallets} new wallets. Total: {wallet_count} wallets.')
    

def start_engine():
    print('Resetting imx_stats in case of previous failure during update.')
    set_engine_values()

    mint_cursor = ''
    transfer_cursor = ''

    while True:
        print('\n########STARTING########\n')
        try:
            # Get the last updated transaction IDs from the imx_stats table
            stats = get_imx_stats()
            # wallet_count, token_count, transaction_count, max_timestamp_mints, max_timestamp_transfers, last_updated_mint_txn_id, last_updated_transfer_txn_id = stats.values()
            # Unpack specific values from the dictionary using dictionary unpacking
            max_timestamp_mints, max_timestamp_transfers, last_updated_mint_txn_id, last_updated_transfer_txn_id = stats['max_mints_timestamp'], stats['max_transfers_timestamp'], stats['last_updated_mint_txn_id'], stats['last_updated_transfer_txn_id']
            
            mint_response, transfer_response = get_mint_and_transfer_data(max_timestamp_mints, max_timestamp_transfers, mint_cursor, transfer_cursor)

            if mint_response.status_code == 200 and transfer_response.status_code == 200:
                wallets = []
                mint_data = mint_response.json()
                transfer_data = transfer_response.json()
                batch_size = 200

                mint_records = process_mint_data(mint_data, max_timestamp_mints, last_updated_mint_txn_id, batch_size, wallets)
                transfer_records = process_transfer_data(transfer_data, max_timestamp_transfers, last_updated_transfer_txn_id, batch_size, wallets)

                if mint_records:
                    insert_veve_mints(mint_records)
                if transfer_records:
                    insert_veve_transfers(transfer_records)
                
                # Update the cursors if there is more data
                mint_cursor = mint_data['cursor'] if mint_data['remaining'] == 1 else ''
                transfer_cursor = transfer_data['cursor'] if transfer_data['remaining'] == 1 else ''

                update_veve_wallets(wallets)

            else:
                print("Error: Bad API request.")
                print("Mint Response:", mint_response.status_code, mint_response.content)
                print("Transfer Response:", transfer_response.status_code, transfer_response.content)

            print('')
            print('Sleeping for 10 sec!\n\n')
            time.sleep(10)

        except requests.exceptions.RequestException as error:
            print("Error making API request:", error)
        except requests.exceptions.HTTPError as error:
            print("HTTP Error:", error)
        except requests.exceptions.ConnectionError as error:
            print("Connection Error:", error)
        except requests.exceptions.Timeout as error:
            print("Request Timeout:", error)
        except ValueError as error:
            print("JSON Decode Error:", error)
        except mysql.connector.Error as error:
            print("MySQL Database Error:", error)
        except Exception as error:
            print("An error occurred:", error)

if __name__ == '__main__':
    start_engine()

