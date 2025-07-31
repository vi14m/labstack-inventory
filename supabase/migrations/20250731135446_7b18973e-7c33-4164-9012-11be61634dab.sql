-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create enum for transaction types
CREATE TYPE public.transaction_type AS ENUM ('inward', 'outward');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create components table
CREATE TABLE public.components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  part_number TEXT NOT NULL UNIQUE,
  manufacturer_supplier TEXT,
  description TEXT,
  category TEXT NOT NULL,
  current_quantity INTEGER NOT NULL DEFAULT 0,
  location_bin TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  datasheet_link TEXT,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  last_inward_date TIMESTAMP WITH TIME ZONE,
  last_outward_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create transactions table for tracking inward/outward movements
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason_project TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'low_stock', 'old_stock'
  component_id UUID REFERENCES public.components(id),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS user_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.profiles
  WHERE user_id = _user_id
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for components
CREATE POLICY "Everyone can view components" ON public.components
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert components" ON public.components
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update components" ON public.components
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete components" ON public.components
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for transactions
CREATE POLICY "Everyone can view transactions" ON public.transactions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_components_updated_at
  BEFORE UPDATE ON public.components
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update component quantities and dates after transaction
CREATE OR REPLACE FUNCTION public.update_component_after_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.transaction_type = 'inward' THEN
    UPDATE public.components
    SET 
      current_quantity = current_quantity + NEW.quantity,
      last_inward_date = NEW.transaction_date,
      updated_at = now()
    WHERE id = NEW.component_id;
  ELSE -- outward
    UPDATE public.components
    SET 
      current_quantity = current_quantity - NEW.quantity,
      last_outward_date = NEW.transaction_date,
      updated_at = now()
    WHERE id = NEW.component_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for updating component quantities
CREATE TRIGGER update_component_after_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_component_after_transaction();

-- Insert sample components data
INSERT INTO public.components (component_name, part_number, manufacturer_supplier, description, category, current_quantity, location_bin, unit_price, low_stock_threshold) VALUES
('100Ω 1/4W Resistor', 'R100_1/4W', 'Generic', '100 Ohm 1/4 Watt Carbon Film Resistor', 'Resistors', 500, 'R-Shelf-A1', 0.50, 100),
('0.1µF Ceramic Cap', 'C0.1UF_50V_CER', 'Generic', '0.1µF 50V Ceramic Capacitor', 'Capacitors', 800, 'C-Bin-B1', 0.80, 200),
('10µH Inductor', 'L10UH', 'Generic', '10µH Fixed Inductor', 'Inductors', 100, 'L-Bin-C1', 3.00, 25),
('1N4007 Diode', '1N4007', 'Generic', '1N4007 1A 1000V Rectifier Diode', 'Diodes', 300, 'D-Bin-D1', 1.00, 75),
('BC547 NPN Transistor', 'BC547B', 'Generic', 'BC547 NPN General Purpose Transistor', 'Transistors', 200, 'T-Tray-E1', 1.20, 50),
('NE555 Timer IC', 'NE555P', 'Texas Instruments', 'NE555 Precision Timer IC', 'Integrated Circuits', 80, 'IC-Box-F1', 8.00, 20),
('ATmega328P (DIP)', 'ATMEGA328P-PU', 'Microchip', 'ATmega328P 8-bit Microcontroller', 'Microcontrollers', 30, 'IC-Box-F3', 150.00, 5),
('DHT11 Temp/Humidity Sensor', 'DHT11', 'Aosong', 'DHT11 Digital Temperature and Humidity Sensor', 'Sensors', 15, 'Sensor-H1', 50.00, 3),
('JST-XH 2-pin Connector', 'B2B-XH-A(LF)(SN)', 'JST', 'JST-XH 2-pin Male Connector', 'Connectors', 50, 'Conn-G2', 4.00, 10),
('Tactile Push Button (6×6mm)', 'BTN-TACT-6X6', 'Generic', '6x6mm Tactile Push Button Switch', 'Switches/Buttons', 100, 'Switch-J1', 1.00, 25),
('16x2 LCD Display', 'LCD1602', 'Generic', '16x2 Character LCD Display', 'LEDs/Displays', 10, 'LCD-Box-K2', 150.00, 2),
('Jumper Wires (40pc, M-M)', 'JMP-MM-40', 'Generic', '40-piece Male-to-Male Jumper Wire Set', 'Cables/Wires', 10, 'Cable-L1', 80.00, 2),
('M3 Screws (10mm)', 'SCR-M3-10MM', 'Generic', 'M3x10mm Phillips Head Screws', 'Mechanical Parts', 200, 'Mech-M1', 0.50, 50),
('Solder Wire (0.8mm)', 'SOLDER-0.8MM', 'Generic', '0.8mm Lead-free Solder Wire', 'Misc Supplies', 5, 'Misc-N1', 300.00, 1);