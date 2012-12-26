module ApplicationHelper

  # -------------------------------------------------------------
  # Gets a value indicating whether the application needs to present the
  # initial setup screen. This is currently true if the User table is empty,
  # meaning that nobody has accessed the application and created the initial
  # admin user.
  #
  def needs_initial_setup?
    User.count == 0
  end
  
  # -------------------------------------------------------------
  # Returns the correct twitter bootstrap class mapping for different
  # types of flash messages
  # 
  def flash_class(level)
    case level
    when :notice then "alert-info"
    when :error then "alert-error"
    when :alert then ""
    end
  end

  # Devise helpers

  # -------------------------------------------------------------
  def resource_name
    :user
  end

  # -------------------------------------------------------------
  def resource
    @resource ||= User.new
  end

  # -------------------------------------------------------------
  def devise_mapping
    @devise_mapping ||= Devise.mappings[:user]
  end

  # -------------------------------------------------------------
  def devise_error_messages!
    return "" if resource.nil? || resource.errors.empty?

    messages = resource.errors.full_messages.map { |msg| content_tag(:li, msg) }.join
    sentence = I18n.t("errors.messages.not_saved",
                      :count => resource.errors.count,
                      :resource => resource_name)

    html = <<-HTML
<div id="error_explanation">
<h2>#{sentence}</h2>
<ul>#{messages}</ul>
</div>
HTML

    html.html_safe
  end

  # -------------------------------------------------------------
  def dropdown_tag
    # %a.dropdown-toggle{"data-toggle" => "dropdown", :href => "#"}
    content_tag :a, :href => '#', :class => 'dropdown-toggle',
      :'data-toggle' => 'dropdown' do
      yield
    end
  end


  # -------------------------------------------------------------
  def nav_item_tag(destination)
    # %li{:class => ("active" if params[:controller] == 'home')}
    #   %a{:href => url_for(:controller => 'home')}

    content_tag :li, :class => ('active' if params[:controller] == destination.to_s) do
      link_to :controller => destination do
        yield
      end
    end
  end


  # -------------------------------------------------------------
  def form_errors(model)
    render partial: 'form_errors', locals: { model: model }
  end


  # -------------------------------------------------------------
  def shallow_args(parent, child)
    child.try(:new_record?) ? [parent, child] : child
  end


  # -------------------------------------------------------------
  # Outputs a Twitter Bootstrap form with .form-horizontal, including an
  # error alert at the top (if there are any model errors), and handling
  # shallow nested arguments gracefully (in the case of new vs. edit).
  def pythy_form_for(*args, &block)
    if args.length == 2
      parent = args[0]
      child = args[1]
      form_args = child.try(:new_record?) ? [parent, child] : child
    else
      parent = nil
      child = args[0]
      form_args = child
    end

    capture do
      twitter_bootstrap_form_for(form_args,
        html: { class: 'form-horizontal' }) do |f|
        concat form_errors child
        yield f
      end
    end
  end


  # -------------------------------------------------------------
  # Creates a text field with Twitter Bootstrap typeahead functionality.
  #
  # Options:
  #   url: the URL that will return a JSON array of entries for the field;
  #        it will be sent a parameter named "query" with the contents of
  #        the field
  #   submit: true to submit the parent form when an item is selected from
  #           the typeahead list
  #
  def typeahead_field_tag(name, value = nil, options = {})
    data = options['data'] || {}
    data.merge! provide: 'typeahead'
    data.merge! url: options.delete(:url)
    data.merge! submit: options.delete(:submit) && 'yes'
    options['data'] = data

    if options['class']
      options['class'] += ' typeahead'
    else
      options['class'] = 'typeahead'
    end

    options['autocomplete'] = 'off'

    text_field_tag name, value, options
  end


  # -------------------------------------------------------------
  def controller_stylesheet_link_tag
    c = params[:controller]
    stylesheet_link_tag c if Rails.application.assets.find_asset("#{c}.css")
  end


  # -------------------------------------------------------------
  def controller_javascript_include_tag
    c = params[:controller]
    javascript_include_tag c if Rails.application.assets.find_asset("#{c}.js")
  end

end
