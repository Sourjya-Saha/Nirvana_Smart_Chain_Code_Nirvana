from sql_connection import get_sql_connection
from datetime import date, datetime
import json
import base64
import re


def parse_safe_date(date_val):
    if not date_val:
        return None
    if hasattr(date_val, 'strftime'):
        return date_val.strftime("%Y-%m-%d")
    d_str = str(date_val).strip()
    if not d_str or d_str in ("None", "null", "undefined", "—"):
        return None
    if re.match(r"^\d{4}-\d{2}-\d{2}$", d_str):
        return d_str
    for fmt in (
        "%a, %d %b %Y %H:%M:%S %Z",
        "%a, %d %b %Y",
        "%d %b %Y",
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y/%m/%d"
    ):
        try:
            return datetime.strptime(d_str, fmt).strftime("%Y-%m-%d")
        except Exception:
            pass
    match = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", d_str)
    if match:
        y, m, d = match.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    return None


def get_all_products(connection, user_id):
    cursor = connection.cursor()

    query = """
        SELECT products.id, products.name, products.price_per_unit, uom_table.uom_name,
               products.quantity_of_uom, products.category, products.exp_date,
               products.shelf_num, products.picture_of_the_prod, products.description,
               products.reference_cart, products.uom_id
        FROM products
        INNER JOIN uom_table ON products.uom_id = uom_table.uom_id
        WHERE products.user_id = %s
    """

    cursor.execute(query, (user_id,))

    response = []

    for (
        id,
        name,
        price_per_unit,
        uom_name,
        quantity_of_uom,
        category,
        exp_date,
        shelf_num,
        picture_of_the_prod,
        description,
        reference_cart,
        uom_id
    ) in cursor:

        image_base64 = None
        if picture_of_the_prod:
            image_base64 = base64.b64encode(picture_of_the_prod).decode("utf-8")

        try:
            parsed_reference_cart = json.loads(reference_cart) if reference_cart else {}
        except json.JSONDecodeError:
            parsed_reference_cart = {}

        formatted_exp_date = (
            exp_date.strftime("%Y-%m-%d")
            if hasattr(exp_date, "strftime") and exp_date
            else (str(exp_date) if exp_date else None)
        )

        response.append({
            "product_id": id,
            "name": name,
            "price_per_unit": price_per_unit,
            "uom_name": uom_name,
            "quantity_of_uom": quantity_of_uom,
            "category": category,
            "exp_date": formatted_exp_date,
            "shelf_num": shelf_num,
            "picture_of_the_prod": image_base64,
            "description": description,
            "reference_cart": parsed_reference_cart,
            "uom_id": uom_id
        })

    return response


def insert_new_product(connection, product, user_id, cart_id=None):
    cursor = connection.cursor()

    reference_cart = None

    if cart_id:
        reference_cart = {
            "0": {
                "cart_id": cart_id,
                "quantity": product.get("quantity_of_uom", 0),
                "exp_date": product.get("exp_date")
            }
        }

    query = """
        INSERT INTO products
        (name, uom_id, price_per_unit, quantity_of_uom, category, exp_date,
         shelf_num, picture_of_the_prod, description, user_id, reference_cart)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    name = str(product.get("name") or "").strip()[:255]
    category = str(product.get("category") or "").strip()[:100]
    shelf_num = str(product.get("shelf_num") or "").strip()[:100]
    description = str(product.get("description") or "").strip()
    exp_date = parse_safe_date(product.get("exp_date")) or str(date.today())

    data = (
        name,
        product.get("uom_id"),
        product.get("price_per_unit"),
        product.get("quantity_of_uom"),
        category,
        exp_date,
        shelf_num,
        product.get("picture_of_the_prod"),
        description,
        user_id,
        json.dumps(reference_cart) if reference_cart else None
    )

    cursor.execute(query, data)
    connection.commit()

    return cursor.lastrowid


def delete_product(connection, product_id):
    cursor = connection.cursor()

    query = "DELETE FROM products WHERE id = %s"

    cursor.execute(query, (product_id,))
    connection.commit()

    return product_id


def edit_product(connection, product_id, updated_product):
    cursor = connection.cursor()

    name = str(updated_product.get("name") or "").strip()[:255]
    category = str(updated_product.get("category") or "").strip()[:100]
    shelf_num = str(updated_product.get("shelf_num") or "").strip()[:100]
    description = str(updated_product.get("description") or "").strip()
    safe_exp_date = parse_safe_date(updated_product.get("exp_date"))

    uom_id = updated_product.get("uom_id")
    if uom_id is not None:
        try:
            uom_id = int(uom_id)
        except (ValueError, TypeError):
            uom_id = None

    image_blob = updated_product.get("picture_of_the_prod")
    has_new_image = (
        image_blob is not None
        and isinstance(image_blob, (bytes, bytearray))
        and len(image_blob) > 0
    )

    if has_new_image:
        query = """
            UPDATE products SET
            name = %s,
            price_per_unit = %s,
            quantity_of_uom = %s,
            category = %s,
            shelf_num = %s,
            description = %s,
            exp_date = COALESCE(%s, exp_date),
            uom_id = COALESCE(%s, uom_id),
            picture_of_the_prod = %s
            WHERE id = %s
        """
        data = (
            name,
            updated_product.get("price_per_unit"),
            updated_product.get("quantity_of_uom"),
            category,
            shelf_num,
            description,
            safe_exp_date,
            uom_id,
            image_blob,
            product_id
        )
    else:
        query = """
            UPDATE products SET
            name = %s,
            price_per_unit = %s,
            quantity_of_uom = %s,
            category = %s,
            shelf_num = %s,
            description = %s,
            exp_date = COALESCE(%s, exp_date),
            uom_id = COALESCE(%s, uom_id)
            WHERE id = %s
        """
        data = (
            name,
            updated_product.get("price_per_unit"),
            updated_product.get("quantity_of_uom"),
            category,
            shelf_num,
            description,
            safe_exp_date,
            uom_id,
            product_id
        )

    cursor.execute(query, data)
    connection.commit()

    return cursor.rowcount

def add_cart_products(connection, cart_id, user_id):
    cursor = connection.cursor()

    # Query to fetch products from cart and join with products_manu using product_id
    query = ("""
        SELECT p.name, p.uom_id, p.price_per_unit, p.quantity_of_uom, p.category, 
               p.exp_date, p.shelf_num, p.picture_of_the_prod, p.description, c.quantity
        FROM cart_manu c
        JOIN products_manu p ON c.product_id = p.id
        WHERE c.cart_id = %s
    """)

    print(f"Fetching products from cart_id: {cart_id}")
    cursor.execute(query, (cart_id,))
    products_in_cart = cursor.fetchall()
    print(f"Products in cart: {products_in_cart}")

    inserted_or_updated_product_ids = []

    for product in products_in_cart:
        product_data = {
            'name': product[0],
            'uom_id': product[1],
            'price_per_unit': product[2],
            'quantity_of_uom': product[3],
            'category': product[4],
            'exp_date': product[5],
            'shelf_num': product[6],
            'picture_of_the_prod': product[7],
            'description': product[8],
            'quantity': product[9]  # Quantity from cart
        }

        # Check if product exists and get reference_cart
        check_query = """
            SELECT id, quantity_of_uom, reference_cart 
            FROM products 
            WHERE name = %s AND user_id = %s
        """

        print(f"Checking if product '{product_data['name']}' exists for user_id: {user_id}")
        cursor.execute(check_query, (product_data['name'], user_id))
        existing_product = cursor.fetchone()
        print(f"Existing product: {existing_product}")

        if existing_product:
            product_id = existing_product[0]
            existing_quantity = existing_product[1]
            existing_reference_cart = existing_product[2] or '{}'

            try:
                cart_references = json.loads(existing_reference_cart)
                print(f"Current reference_cart: {cart_references}")
            except json.JSONDecodeError:
                cart_references = {}
                print("Error decoding reference_cart, starting with empty dictionary.")

            # Check if cart_id already exists in references
            cart_id_exists = any(
                ref.get("cart_id") == cart_id
                for ref in cart_references.values()
            )

            if cart_id_exists:
                print(f"Cart ID {cart_id} already exists in reference_cart for product '{product_data['name']}'")
                continue

            # Add new cart reference
            next_index = str(len(cart_references))
            cart_references[next_index] = {
                "cart_id": cart_id,
                "quantity": product_data['quantity'],
                "exp_date": product_data['exp_date'].isoformat() if product_data['exp_date'] else None
            }

            new_quantity = existing_quantity + product_data['quantity']

            # Update product with new quantity and reference_cart
            update_query = """
                UPDATE products 
                SET quantity_of_uom = %s, reference_cart = %s 
                WHERE id = %s
            """

            print(
                f"Updating product '{product_data['name']}' with new quantity: {new_quantity} and reference_cart: {cart_references}")
            cursor.execute(update_query, (
                new_quantity,
                json.dumps(cart_references),
                product_id
            ))
            print(f"Updated product '{product_data['name']}' successfully.")

            inserted_or_updated_product_ids.append(product_id)
        else:
            # For new products, initialize reference_cart with the cart_id
            initial_reference_cart = {
                "0": {
                    "cart_id": cart_id,
                    "quantity": product_data['quantity'],
                    "exp_date": product_data['exp_date'].isoformat() if product_data['exp_date'] else None
                }
            }
            product_data['reference_cart'] = json.dumps(initial_reference_cart)

            print(f"Inserting new product '{product_data['name']}'")
            new_product_id = insert_new_product(connection, product_data, user_id)
            print(f"Inserted new product '{product_data['name']}' with ID: {new_product_id}")

            inserted_or_updated_product_ids.append(new_product_id)

    connection.commit()
    print(f"All products processed. Inserted/Updated product IDs: {inserted_or_updated_product_ids}")
    return inserted_or_updated_product_ids





def add_cart_products_whole(connection, cart_id, user_id):
    cursor = connection.cursor()

    # Query to fetch the cart details, which now stores products in JSON format
    query = """
        SELECT products, products_added
        FROM cart_whole
        WHERE cart_id = %s
    """
    cursor.execute(query, (cart_id,))
    cart_data = cursor.fetchone()  # Fetch the cart data

    if cart_data and cart_data[1] == 0:  # Check if products_added is 0 (column index 1)
        # Parse the products JSON data
        products_in_cart = json.loads(cart_data[0])  # Assuming 'products' is a JSON string

        inserted_or_updated_product_ids = []  # To store inserted or updated product IDs

        # Loop through all products in the cart JSON
        for product_key, product_value in products_in_cart.items():
            product_data = {
                'product_id': product_value['product_id'],
                'quantity': product_value['quantity'],
            }

            # Fetch the product details based on the product_id
            product_query = "SELECT name, uom_id, price_per_unit, quantity_of_uom, category, exp_date, shelf_num, picture_of_the_prod, description FROM products_whole WHERE id = %s"
            cursor.execute(product_query, (product_data['product_id'],))
            product = cursor.fetchone()

            if product:
                # Map the fetched product data into the expected format
                product_data.update({
                    'name': product[0],
                    'uom_id': product[1],
                    'price_per_unit': product[2],
                    'quantity_of_uom': product[3],
                    'category': product[4],
                    'exp_date': product[5],
                    'shelf_num': product[6],
                    'picture_of_the_prod': product[7],
                    'description': product[8]
                })

                # Check if the product already exists in the user's inventory
                check_query = "SELECT id, quantity_of_uom FROM products WHERE name = %s AND user_id = %s"
                cursor.execute(check_query, (product_data['name'], user_id))
                existing_product = cursor.fetchone()

                if existing_product:
                    # Product exists, update the quantity
                    product_id = existing_product[0]
                    existing_quantity = existing_product[1]
                    new_quantity = existing_quantity + product_data['quantity']

                    # Update the quantity of the existing product
                    update_query = "UPDATE products SET quantity_of_uom = %s WHERE id = %s"
                    cursor.execute(update_query, (new_quantity, product_id))
                    print(f"Updated product '{product_data['name']}' with new quantity: {new_quantity}")

                    # Append the product ID to the list
                    inserted_or_updated_product_ids.append(product_id)
                else:
                    # Insert the new product since it doesn't exist
                    new_product_id = insert_new_product(connection, product_data, user_id)
                    print(f"Inserted new product '{product_data['name']}' with ID: {new_product_id}")

                    # Append the new product ID to the list
                    inserted_or_updated_product_ids.append(new_product_id)

        # After processing all products, update the products_added field to 1
        update_cart_query = "UPDATE cart_whole SET products_added = 1 WHERE cart_id = %s"
        cursor.execute(update_cart_query, (cart_id,))

        # Commit the changes after processing all products
        connection.commit()

        return inserted_or_updated_product_ids
    else:
        print(f"Cart '{cart_id}' either does not exist or products have already been added.")
        return []






if __name__ == '__main__':
    connection = get_sql_connection()
    print(get_all_products(connection))
    print(insert_new_product(connection, {
        'name': "Aspirin",
        'uom_id': 1,
        'price_per_unit': 50,
        'quantity_of_uom': 100,
        'category': 'fever',
        'exp_date': date(2025, 4, 19),
        'shelf_num': 4,
        'description': 'description'
    }))




    # delete_product(connection, 3)